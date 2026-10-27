import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ErrorState } from '../components/common/ErrorState'
import { EmptyState } from '../components/common/EmptyState'
import { MetricsCard } from '../components/common/MetricsCard'
import { PodStatusDonut } from '../components/charts/PodStatusDonut'
import { MetricsNotice } from '../components/charts/MetricsNotice'
import { ApiError } from '../api/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('Observability Components & Data Integrity', () => {
  it('renders ErrorState with HTTP code, endpoint, and functional retry button', () => {
    const onRetry = vi.fn()
    const error = new ApiError({
      message: 'HTTP 403: Permission denied for this endpoint',
      status: 403,
      endpoint: '/api/pods',
      code: 'HTTP_ERROR',
    })

    render(<ErrorState error={error} endpoint="/api/pods" onRetry={onRetry} />)

    expect(screen.getByText('HTTP 403')).toBeInTheDocument()
    expect(screen.getByText('[HTTP_ERROR]')).toBeInTheDocument()
    expect(screen.getByText(/Permission denied/)).toBeInTheDocument()
    expect(screen.getByText('/api/pods')).toBeInTheDocument()

    const retryBtn = screen.getByRole('button', { name: /Retry Request/i })
    expect(retryBtn).toBeInTheDocument()
    retryBtn.click()
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('renders genuine EmptyState when cluster reports zero items', () => {
    render(
      <EmptyState
        title="Zero pods found"
        description="The cluster reported 0 pods in monitored namespaces."
      />
    )
    expect(screen.getByText('Zero pods found')).toBeInTheDocument()
    expect(screen.getByText(/0 pods in monitored namespaces/)).toBeInTheDocument()
  })

  it('MetricsCard displays actual value and marks stale data prominently', () => {
    const { rerender } = render(
      <MetricsCard
        title="Monitored Pods"
        value={42}
        subtext="38 running"
        isStale={false}
      />
    )
    expect(screen.getByText('Monitored Pods')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.queryByText('Stale')).not.toBeInTheDocument()

    // When stale, prominently identifies stale status
    rerender(
      <MetricsCard
        title="Monitored Pods"
        value={42}
        subtext="38 running"
        isStale={true}
        lastUpdated="2026-10-26T10:00:00Z"
      />
    )
    expect(screen.getByText('Stale')).toBeInTheDocument()

    // Missing value is rendered as Unavailable, never fake 0
    rerender(
      <MetricsCard
        title="Unscheduled Pods"
        value={null}
      />
    )
    expect(screen.getByText('Unavailable')).toBeInTheDocument()
  })

  it('PodStatusDonut renders empty state when total pods is 0, never fake charts', () => {
    render(
      <PodStatusDonut
        summary={{
          total: 0,
          running: 0,
          pending: 0,
          failed: 0,
          unknown: 0,
          terminating: 0,
          unhealthy: 0,
        }}
      />
    )
    expect(screen.getByText('No pods found')).toBeInTheDocument()
  })

  it('MetricsNotice explicitly informs user that metrics-server/Prometheus is required without fake numbers', () => {
    render(<MetricsNotice />, { wrapper: createWrapper() })
    expect(screen.getByText(/Cluster Resource Metrics/)).toBeInTheDocument()
    expect(screen.getByText('Not Configured')).toBeInTheDocument()
    expect(
      screen.getByText(/Kubernetes metrics-server or Prometheus integration is required/)
    ).toBeInTheDocument()
  })
})
