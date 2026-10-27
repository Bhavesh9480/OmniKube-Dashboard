import { z } from 'zod'

export type ApiErrorCode = 'TIMEOUT' | 'NETWORK_ERROR' | 'HTTP_ERROR' | 'SCHEMA_ERROR' | 'UNKNOWN'

export class ApiError extends Error {
  public readonly status: number
  public readonly endpoint: string
  public readonly code: ApiErrorCode
  public readonly timestamp: string
  public readonly rawError?: any

  constructor(opts: {
    message: string
    status?: number
    endpoint: string
    code: ApiErrorCode
    rawError?: any
  }) {
    super(opts.message)
    this.name = 'ApiError'
    this.status = opts.status ?? 0
    this.endpoint = opts.endpoint
    this.code = opts.code
    this.timestamp = new Date().toISOString()
    this.rawError = opts.rawError
  }
}

export function getBaseApiUrl(): string {
  // 1. Check runtime localStorage override (configured in Settings UI)
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('k8s_api_base_url')
    if (saved && saved.trim() !== '') {
      return saved.trim().replace(/\/+$/, '')
    }
  }

  // 2. Check build-time or .env override
  const envUrl = import.meta.env.VITE_API_BASE_URL
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '')
  }

  // 3. Default to relative URL so Vite dev proxy handles requests seamlessly
  return ''
}

export async function fetchWithValidation<T>(
  endpoint: string,
  schema: z.ZodType<T, any, any>,
  options?: RequestInit & { timeoutMs?: number }
): Promise<T> {
  const baseUrl = getBaseApiUrl()
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
  const fullUrl = `${baseUrl}${cleanEndpoint}`

  const timeoutMs = options?.timeoutMs ?? 8000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  let response: Response
  try {
    response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {}),
      },
    })
  } catch (err: any) {
    clearTimeout(timeoutId)
    if (err.name === 'AbortError') {
      throw new ApiError({
        message: `Request timed out after ${timeoutMs}ms`,
        status: 408,
        endpoint,
        code: 'TIMEOUT',
        rawError: err,
      })
    }
    throw new ApiError({
      message: `Unable to connect to the monitoring agent (${err.message || 'Network failure'})`,
      status: 0,
      endpoint,
      code: 'NETWORK_ERROR',
      rawError: err,
    })
  } finally {
    clearTimeout(timeoutId)
  }

  // Handle non-2xx HTTP responses
  if (!response.ok) {
    let errorDetail = ''
    try {
      const errJson = await response.json()
      errorDetail = errJson.detail || errJson.message || JSON.stringify(errJson)
    } catch {
      errorDetail = response.statusText || 'Unknown error'
    }

    let sanitizedMsg = `HTTP ${response.status}: `
    if (response.status === 401) {
      sanitizedMsg += 'Unauthorized access'
    } else if (response.status === 403) {
      sanitizedMsg += 'Permission denied for this endpoint'
    } else if (response.status === 404) {
      sanitizedMsg += `Endpoint ${endpoint} not found`
    } else if (response.status === 503) {
      sanitizedMsg += `Service unavailable: ${errorDetail}`
    } else if (response.status >= 500) {
      sanitizedMsg += `Internal server error (${errorDetail})`
    } else {
      sanitizedMsg += errorDetail
    }

    throw new ApiError({
      message: sanitizedMsg,
      status: response.status,
      endpoint,
      code: 'HTTP_ERROR',
      rawError: errorDetail,
    })
  }

  // Parse JSON
  let rawData: unknown
  try {
    rawData = await response.json()
  } catch (err: any) {
    throw new ApiError({
      message: 'The server returned an invalid non-JSON response',
      status: response.status,
      endpoint,
      code: 'SCHEMA_ERROR',
      rawError: err,
    })
  }

  // Validate with Zod schema
  const validationResult = schema.safeParse(rawData)
  if (!validationResult.success) {
    const errorDetails = validationResult.error.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join(', ')
    throw new ApiError({
      message: `Response schema validation failed (${errorDetails})`,
      status: response.status,
      endpoint,
      code: 'SCHEMA_ERROR',
      rawError: validationResult.error,
    })
  }

  return validationResult.data
}
