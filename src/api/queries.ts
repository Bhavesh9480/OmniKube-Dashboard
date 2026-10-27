import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { fetchWithValidation, ApiError } from './client'
import {
  SummaryResponseSchema,
  PodsListResponseSchema,
  DeploymentsListResponseSchema,
  ServicesListResponseSchema,
  EndpointSlicesListResponseSchema,
  AlertsListResponseSchema,
  EventsListResponseSchema,
  DetailedHealthResponseSchema,
  MetricsStatusResponseSchema,
} from './schemas'
import {
  SummaryResponse,
  PodsListResponse,
  DeploymentsListResponse,
  ServicesListResponse,
  EndpointSlicesListResponse,
  AlertsListResponse,
  EventsListResponse,
  DetailedHealthResponse,
  MetricsStatusResponse,
} from './types'

export const queryKeys = {
  all: ['k8s'] as const,
  summary: () => [...queryKeys.all, 'summary'] as const,
  pods: (filters?: Record<string, any>) => [...queryKeys.all, 'pods', filters] as const,
  deployments: (filters?: Record<string, any>) => [...queryKeys.all, 'deployments', filters] as const,
  services: (filters?: Record<string, any>) => [...queryKeys.all, 'services', filters] as const,
  endpointslices: (filters?: Record<string, any>) => [...queryKeys.all, 'endpointslices', filters] as const,
  alerts: (filters?: Record<string, any>) => [...queryKeys.all, 'alerts', filters] as const,
  events: (filters?: Record<string, any>) => [...queryKeys.all, 'events', filters] as const,
  health: () => [...queryKeys.all, 'health'] as const,
  metricsStatus: () => [...queryKeys.all, 'metrics-status'] as const,
}

function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError) {
    // Never retry client errors (401, 403, 404) or schema errors
    if (error.status === 401 || error.status === 403 || error.status === 404 || error.code === 'SCHEMA_ERROR') {
      return false
    }
  }
  return failureCount < 2
}

export function useSummary(options?: Partial<UseQueryOptions<SummaryResponse, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.summary(),
    queryFn: () => fetchWithValidation('/api/summary', SummaryResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function usePods(
  filters?: {
    namespace?: string
    phase?: string
    attention?: boolean
    limit?: number
    continue_token?: string
  },
  options?: Partial<UseQueryOptions<PodsListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.phase) queryParams.set('phase', filters.phase)
  if (filters?.attention !== undefined) queryParams.set('attention', String(filters.attention))
  if (filters?.limit) queryParams.set('limit', String(filters.limit))
  if (filters?.continue_token) queryParams.set('continue_token', filters.continue_token)

  const queryString = queryParams.toString()
  const endpoint = `/api/pods${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.pods(filters),
    queryFn: () => fetchWithValidation(endpoint, PodsListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useDeployments(
  filters?: { namespace?: string; attention?: boolean },
  options?: Partial<UseQueryOptions<DeploymentsListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.attention !== undefined) queryParams.set('attention', String(filters.attention))

  const queryString = queryParams.toString()
  const endpoint = `/api/deployments${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.deployments(filters),
    queryFn: () => fetchWithValidation(endpoint, DeploymentsListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useServices(
  filters?: { namespace?: string; attention?: boolean },
  options?: Partial<UseQueryOptions<ServicesListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.attention !== undefined) queryParams.set('attention', String(filters.attention))

  const queryString = queryParams.toString()
  const endpoint = `/api/services${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.services(filters),
    queryFn: () => fetchWithValidation(endpoint, ServicesListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useEndpointSlices(
  filters?: { namespace?: string; service_name?: string },
  options?: Partial<UseQueryOptions<EndpointSlicesListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.service_name) queryParams.set('service_name', filters.service_name)

  const queryString = queryParams.toString()
  const endpoint = `/api/endpointslices${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.endpointslices(filters),
    queryFn: () => fetchWithValidation(endpoint, EndpointSlicesListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useAlerts(
  filters?: { severity?: string; namespace?: string; limit?: number },
  options?: Partial<UseQueryOptions<AlertsListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.severity) queryParams.set('severity', filters.severity)
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.limit) queryParams.set('limit', String(filters.limit))

  const queryString = queryParams.toString()
  const endpoint = `/api/alerts${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.alerts(filters),
    queryFn: () => fetchWithValidation(endpoint, AlertsListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useEvents(
  filters?: { namespace?: string; type?: string; limit?: number },
  options?: Partial<UseQueryOptions<EventsListResponse, ApiError>>
) {
  const queryParams = new URLSearchParams()
  if (filters?.namespace) queryParams.set('namespace', filters.namespace)
  if (filters?.type) queryParams.set('type', filters.type)
  if (filters?.limit) queryParams.set('limit', String(filters.limit))

  const queryString = queryParams.toString()
  const endpoint = `/api/events${queryString ? `?${queryString}` : ''}`

  return useQuery({
    queryKey: queryKeys.events(filters),
    queryFn: () => fetchWithValidation(endpoint, EventsListResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useHealthDiagnostics(options?: Partial<UseQueryOptions<DetailedHealthResponse, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: () => fetchWithValidation('/api/health', DetailedHealthResponseSchema),
    staleTime: 10000,
    retry: shouldRetry,
    ...options,
  })
}

export function useMetricsStatus(options?: Partial<UseQueryOptions<MetricsStatusResponse, ApiError>>) {
  return useQuery({
    queryKey: queryKeys.metricsStatus(),
    queryFn: () => fetchWithValidation('/api/metrics/status', MetricsStatusResponseSchema),
    staleTime: 60000,
    retry: false,
    ...options,
  })
}
