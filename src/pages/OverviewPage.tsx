import React from 'react'
import {
  useSummary,
  usePods,
  useDeployments,
  useAlerts,
  useEvents,
} from '../api/queries'
import { MetricsCard } from '../components/common/MetricsCard'
import { ErrorState } from '../components/common/ErrorState'
import { CardSkeleton } from '../components/common/LoadingSkeleton'
import { PodStatusDonut } from '../components/charts/PodStatusDonut'
import { DeploymentReplicaBar } from '../components/charts/DeploymentReplicaBar'
import { AlertSeverityDonut } from '../components/charts/AlertSeverityDonut'
import { EventTimeline } from '../components/charts/EventTimeline'
import { MetricsNotice } from '../components/charts/MetricsNotice'
import {
  Layers,
  Server,
  Network,
  AlertOctagon,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

export const OverviewPage: React.FC = () => {
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    error: summaryError,
    refetch: refetchSummary,
    isFetching: isSummaryFetching,
  } = useSummary()

  const { data: podsData } = usePods()
  const { data: deploymentsData } = useDeployments()
  const { data: alertsData } = useAlerts()
  const { data: eventsData } = useEvents({ limit: 20 })

  const lastSync = summary?.cluster?.lastSuccessfulSync
  const isStale = lastSync ? Date.now() - new Date(lastSync).getTime() > 120000 : false

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Cluster Health Overview
          </h2>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Authoritative, real-time telemetry aggregated across monitored namespaces
          </p>
        </div>
      </div>

      {/* Summary Failure Banner */}
      {isSummaryError && (
        <ErrorState
          error={summaryError}
          title="Summary Endpoint Unavailable"
          endpoint="/api/summary"
          onRetry={refetchSummary}
          isRefetching={isSummaryFetching}
        />
      )}

      {/* Primary Key Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isSummaryLoading && !summary ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Total Pods Card */}
            <MetricsCard
              title="Monitored Pods"
              value={summary?.pods?.total ?? podsData?.count}
              subtext={
                summary
                  ? `${summary.pods.running} running, ${summary.pods.failed} failed, ${summary.pods.pending} pending`
                  : undefined
              }
              variant={summary && summary.pods.failed > 0 ? 'danger' : 'default'}
              icon={<Layers className="w-4 h-4" />}
              isStale={isStale}
              lastUpdated={lastSync}
            />

            {/* Pod Health / Attention Card */}
            <MetricsCard
              title="Unhealthy Pods"
              value={summary?.pods?.unhealthy}
              subtext={
                summary && summary.pods.terminating > 0
                  ? `${summary.pods.terminating} terminating`
                  : 'Pods requiring attention'
              }
              variant={summary && summary.pods.unhealthy > 0 ? 'warning' : 'success'}
              icon={
                summary && summary.pods.unhealthy > 0 ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                )
              }
              isStale={isStale}
              lastUpdated={lastSync}
            />

            {/* Deployments Card */}
            <MetricsCard
              title="Deployments"
              value={summary?.deployments?.total ?? deploymentsData?.count}
              subtext={
                summary
                  ? `${summary.deployments.healthy} healthy, ${summary.deployments.unhealthy} degraded`
                  : undefined
              }
              variant={summary && summary.deployments.unhealthy > 0 ? 'warning' : 'success'}
              icon={<Server className="w-4 h-4" />}
              isStale={isStale}
              lastUpdated={lastSync}
            />

            {/* Active Alerts Card */}
            <MetricsCard
              title="Active Incidents"
              value={summary?.alerts?.total ?? alertsData?.count}
              subtext={
                summary
                  ? `${summary.alerts.critical} critical, ${summary.alerts.warning} warning`
                  : undefined
              }
              variant={
                summary && summary.alerts.critical > 0
                  ? 'danger'
                  : summary && summary.alerts.warning > 0
                  ? 'warning'
                  : 'success'
              }
              icon={
                summary && summary.alerts.critical > 0 ? (
                  <XCircle className="w-4 h-4 text-rose-500" />
                ) : (
                  <AlertOctagon className="w-4 h-4" />
                )
              }
              isStale={isStale}
              lastUpdated={lastSync}
            />
          </>
        )}
      </div>

      {/* Secondary Service & Cluster Connectivity Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricsCard
          title="Monitored Services"
          value={summary?.services?.total}
          subtext={
            summary?.services
              ? `${summary.services.withoutReadyEndpoints} lacking ready endpoints`
              : undefined
          }
          variant={summary && summary.services.withoutReadyEndpoints > 0 ? 'warning' : 'default'}
          icon={<Network className="w-4 h-4" />}
          isStale={isStale}
          lastUpdated={lastSync}
        />

        <MetricsCard
          title="Kubernetes API Link"
          value={summary?.cluster?.connected ? 'Connected' : summary ? 'Disconnected' : 'Unavailable'}
          subtext={summary?.cluster?.connected ? 'In-cluster / Kubeconfig auth OK' : 'API server unreachable'}
          variant={summary?.cluster?.connected ? 'success' : 'danger'}
          isStale={isStale}
          lastUpdated={lastSync}
        />

        <MetricsCard
          title="Cluster Health Status"
          value={summary?.status ? summary.status.toUpperCase() : 'Unavailable'}
          subtext="Evaluated by rule engine"
          variant={
            summary?.status === 'healthy'
              ? 'success'
              : summary?.status === 'warning'
              ? 'warning'
              : summary?.status === 'critical'
              ? 'danger'
              : 'default'
          }
          isStale={isStale}
          lastUpdated={lastSync}
        />
      </div>

      {/* Visualizations Grid (Charts Strictly from Real Telemetry) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart A: Pod Phase Distribution */}
        <PodStatusDonut
          summary={summary?.pods}
          lastUpdated={lastSync}
          isStale={isStale}
        />

        {/* Chart B: Deployment Availability */}
        <DeploymentReplicaBar
          deployments={deploymentsData?.items}
          lastUpdated={deploymentsData?.lastUpdated || lastSync}
        />

        {/* Chart C: Alert Severity Distribution */}
        <AlertSeverityDonut alerts={alertsData?.items} />

        {/* Chart D: Live Cluster Events Feed */}
        <EventTimeline events={eventsData?.items} />
      </div>

      {/* Chart E: CPU / Memory / Disk Notice */}
      <MetricsNotice />
    </div>
  )
}
