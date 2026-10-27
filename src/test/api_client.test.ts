import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchWithValidation, ApiError } from '../api/client'
import { z } from 'zod'

const MockSchema = z.object({
  status: z.string(),
  count: z.number(),
})

describe('API Client & Schema Validation', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('successfully validates and returns valid API responses', async () => {
    const validPayload = { status: 'healthy', count: 12 }
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => validPayload,
    })

    const result = await fetchWithValidation('/test', MockSchema)
    expect(result).toEqual(validPayload)
  })

  it('rejects unexpected response schemas with SCHEMA_ERROR', async () => {
    const invalidPayload = { status: 123, count: 'not-a-number' } // Schema expects string and number
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => invalidPayload,
    })

    await expect(fetchWithValidation('/test', MockSchema)).rejects.toThrow(ApiError)
    try {
      await fetchWithValidation('/test', MockSchema)
    } catch (err: any) {
      expect(err.code).toBe('SCHEMA_ERROR')
      expect(err.message).toContain('Response schema validation failed')
    }
  })

  it('correctly maps HTTP 403, 404, 500 errors', async () => {
    // 403
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ detail: 'Forbidden' }),
    })
    try {
      await fetchWithValidation('/test', MockSchema)
    } catch (err: any) {
      expect(err.status).toBe(403)
      expect(err.code).toBe('HTTP_ERROR')
      expect(err.message).toContain('Permission denied')
    }

    // 404
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ detail: 'Not Found' }),
    })
    try {
      await fetchWithValidation('/missing', MockSchema)
    } catch (err: any) {
      expect(err.status).toBe(404)
      expect(err.message).toContain('Endpoint /missing not found')
    }

    // 500
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Internal failure' }),
    })
    try {
      await fetchWithValidation('/error', MockSchema)
    } catch (err: any) {
      expect(err.status).toBe(500)
      expect(err.message).toContain('Internal server error')
    }
  })

  it('handles network failure with NETWORK_ERROR code', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch'))

    try {
      await fetchWithValidation('/test', MockSchema)
    } catch (err: any) {
      expect(err.code).toBe('NETWORK_ERROR')
      expect(err.message).toContain('Unable to connect to the monitoring agent')
    }
  })

  it('handles request timeout with TIMEOUT code', async () => {
    const abortErr = new Error('The operation was aborted')
    abortErr.name = 'AbortError'
    global.fetch = vi.fn().mockRejectedValue(abortErr)

    try {
      await fetchWithValidation('/slow', MockSchema, { timeoutMs: 100 })
    } catch (err: any) {
      expect(err.code).toBe('TIMEOUT')
      expect(err.status).toBe(408)
      expect(err.message).toContain('timed out')
    }
  })
})
