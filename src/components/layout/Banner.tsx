import React from 'react'
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react'
import { useWebSocket } from '../../context/WebSocketContext'
import { useSummary } from '../../api/queries'
import { formatDate } from '../../utils/formatters'

export const Banner: React.FC = () => {
  const { state: wsState, reconnect } = useWebSocket()
  const { data: summary, error: summaryError, isError: isSummaryError } = useSummary()

  const isWsDisconnected = wsState === 'Disconnected' || wsState === 'Reconnecting'
  const lastSync = summary?.cluster?.lastSuccessfulSync
  const isClusterDisconnected = summary && !summary.cluster.connected

  // Check if no message received for a long time
  const isStale = lastSync && Date.now() - new Date(lastSync).getTime() > 120000

  if (!isWsDisconnected && !isSummaryError && !isClusterDisconnected && !isStale) {
    return null
  }

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 text-xs py-2 px-4 space-y-1.5 transition">
      {/* WebSocket Disconnected Warning */}
      {isWsDisconnected && (
        <div className="flex items-center justify-between text-amber-400">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 text-amber-400" />
            <span>
              <strong>Real-time push link interrupted ({wsState.toLowerCase()}).</strong> Falling back to periodic REST refresh.
            </span>
          </div>
          <button
            type="button"
            onClick={reconnect}
            className="flex items-center gap-1 font-medium underline hover:text-amber-300 ml-4"
          >
            <RefreshCw className="w-3 h-3" />
            Reconnect now
          </button>
        </div>
      )}

      {/* Cluster Disconnected Warning */}
      {isClusterDisconnected && (
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Agent is not connected to Kubernetes API server.</strong> The cluster is unreachable or kubeconfig/in-cluster permissions are invalid.
          </span>
        </div>
      )}

      {/* Summary REST Failure */}
      {isSummaryError && (
        <div className="flex items-center gap-2 text-rose-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <strong>Cluster overview endpoint failed:</strong> {summaryError?.message || 'Unable to reach backend'}. Some sections may be operating with partial data.
          </span>
        </div>
      )}

      {/* Stale Cache Notice */}
      {!isSummaryError && isStale && (
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>
            <strong>Showing stale data.</strong> Last successful cluster synchronization: {formatDate(lastSync)}.
          </span>
        </div>
      )}
    </div>
  )
}
