import React from 'react'
import { useHealthDiagnostics, useSummary } from '../api/queries'
import { useWebSocket } from '../context/WebSocketContext'
import { ErrorState } from '../components/common/ErrorState'
import { StatusBadge } from '../components/common/StatusBadge'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { formatDate, formatRelativeTime } from '../utils/formatters'
import {
  HeartPulse,
  Radio,
  Server,
  Layers,
  Activity,
  Database,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react'

export const DiagnosticsPage: React.FC = () => {
  const { state: wsState, lastMessageTime, reconnect } = useWebSocket()
  const {
    data: health,
    isLoading: isHealthLoading,
    isError: isHealthError,
    error: healthError,
    refetch: refetchHealth,
    isFetching: isHealthFetching,
  } = useHealthDiagnostics()

  const { data: summary } = useSummary()

  const lastSync = health?.cache?.lastSuccessfulSync || summary?.cluster?.lastSuccessfulSync
  const cacheAge = health?.cache?.ageSeconds

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <HeartPulse className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Connection & System Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Real-time transport telemetry, watcher threads, cache synchronization, and API health
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetchHealth()}
          disabled={isHealthFetching}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isHealthFetching ? 'animate-spin text-blue-500' : ''}`} />
          Run Health Diagnostics
        </button>
      </div>

      {isHealthError && (
        <ErrorState
          error={healthError}
          title="Diagnostic Health Endpoint Failed"
          endpoint="/api/health"
          onRetry={refetchHealth}
          isRefetching={isHealthFetching}
        />
      )}

      {/* Grid: 3 Telemetry Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Pillar 1: WebSocket Real-Time Transport */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-500" />
              WebSocket Push Transport
            </h3>
            <StatusBadge status={wsState === 'Connected'} label={wsState} />
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Connection State</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{wsState}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Protocol</span>
              <span className="text-slate-800 dark:text-slate-200">Native WebSocket (RFC 6455)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Target Endpoint</span>
              <span className="text-slate-800 dark:text-slate-200">/api/ws</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Last Received Ping/Message</span>
              <span className="text-slate-800 dark:text-slate-200">
                {lastMessageTime > 0 ? formatRelativeTime(new Date(lastMessageTime).toISOString()) : 'None'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Heartbeat Interval</span>
              <span className="text-slate-800 dark:text-slate-200">15s</span>
            </div>
          </div>

          {wsState !== 'Connected' && (
            <div className="pt-2">
              <button
                type="button"
                onClick={reconnect}
                className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition shadow-sm"
              >
                Trigger Immediate Reconnect
              </button>
            </div>
          )}
        </div>

        {/* Pillar 2: Kubernetes API Connectivity */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-500" />
              Kubernetes API Client
            </h3>
            <StatusBadge
              status={health?.kubernetes?.connected}
              label={health?.kubernetes?.connected ? 'Connected' : 'Disconnected'}
            />
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Agent Version</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                v{health?.agentVersion || '1.0.0'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Execution Mode</span>
              <span className="text-slate-800 dark:text-slate-200 font-bold uppercase">
                {health?.mode || 'production'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Simulation Active</span>
              <span className="text-slate-800 dark:text-slate-200">
                {health?.isMock ? 'Mock Mode Enabled' : 'False (Real K8s API)'}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Last Connection Error</span>
              <span className="text-rose-500 max-w-[140px] truncate" title={health?.kubernetes?.lastError || 'None'}>
                {health?.kubernetes?.lastError || 'None'}
              </span>
            </div>
          </div>
        </div>

        {/* Pillar 3: In-Memory Cache Freshness */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-500" />
              In-Memory Cache State
            </h3>
            <StatusBadge
              status={health?.cache?.isFresh}
              label={health?.cache?.isFresh ? 'Fresh' : 'Stale'}
            />
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Initial Sync Completed</span>
              <span className="text-slate-800 dark:text-slate-200">
                {health?.cache?.initialSyncCompleted ? 'True' : 'Pending'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Cache Age</span>
              <span className="text-slate-800 dark:text-slate-200">
                {cacheAge !== undefined && cacheAge !== null ? `${Math.round(cacheAge)}s` : 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/80">
              <span className="text-slate-500">Stale Threshold</span>
              <span className="text-slate-800 dark:text-slate-200">
                {health?.cache?.staleThresholdSeconds || 120}s
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Last Sync Time</span>
              <span className="text-slate-800 dark:text-slate-200">
                {lastSync ? formatDate(lastSync) : 'None'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Watcher Threads Status Panel */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          Background Kubernetes Watcher Threads
        </h3>

        {isHealthLoading && !health ? (
          <LoadingSkeleton rows={4} height="h-8" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
            {Object.entries(health?.watchers || {
              pods: 'running',
              deployments: 'running',
              services: 'running',
              endpointslices: 'running',
              events: 'running',
              reconciliation: 'running',
            }).map(([threadName, threadStatus]) => {
              const isRunning = threadStatus.toLowerCase() === 'running'
              return (
                <div
                  key={threadName}
                  className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-1"
                >
                  <div className="text-[10px] text-slate-500 font-mono uppercase">{threadName}</div>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-semibold">
                    {isRunning ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-500" />
                    )}
                    <span className={isRunning ? 'text-emerald-500' : 'text-rose-500'}>
                      {threadStatus}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cache Resource Counters & Sync Errors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Authoritative Cache Inventory */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-500" />
            Cached Resource Records
          </h3>
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Pods:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {health?.cache?.stats?.pods_count ?? summary?.pods?.total ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Deployments:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {health?.cache?.stats?.deployments_count ?? summary?.deployments?.total ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">Services:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {health?.cache?.stats?.services_count ?? summary?.services?.total ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
              <span className="text-slate-500">EndpointSlices:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {health?.cache?.stats?.endpointslices_count ?? 0}
              </span>
            </div>
            <div className="p-2.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 col-span-2">
              <span className="text-slate-500">Events Recorded:</span>{' '}
              <span className="font-bold text-slate-900 dark:text-white">
                {health?.cache?.stats?.events_count ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Sync Error Stream */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Active Sync Error Telemetry
          </h3>

          {health?.syncErrors && Object.keys(health.syncErrors).length > 0 ? (
            <div className="space-y-2 text-xs font-mono">
              {Object.entries(health.syncErrors).map(([source, err]) => (
                <div
                  key={source}
                  className="p-2.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-300"
                >
                  <div className="font-bold text-rose-400 uppercase">{source}</div>
                  <div className="mt-0.5 text-rose-200 truncate">{err}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Zero sync errors recorded. Cache reconciliations operating normally.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
