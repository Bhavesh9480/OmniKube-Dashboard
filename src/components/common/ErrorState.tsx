import React from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { ApiError } from '../../api/client'
import { formatDate } from '../../utils/formatters'

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  endpoint?: string
  isRefetching?: boolean
  className?: string
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  error,
  title = 'Data Fetching Failure',
  onRetry,
  endpoint,
  isRefetching = false,
  className = '',
}) => {
  let message = 'An unknown error occurred while fetching data.'
  let status: number | null = null
  let code = 'ERROR'
  let failedEndpoint = endpoint || ''
  let timestamp = new Date().toISOString()

  if (error instanceof ApiError) {
    message = error.message
    status = error.status > 0 ? error.status : null
    code = error.code
    failedEndpoint = error.endpoint || failedEndpoint
    timestamp = error.timestamp
  } else if (error instanceof Error) {
    message = error.message
  }

  return (
    <div
      role="alert"
      className={`rounded-lg border border-rose-500/30 bg-rose-500/10 p-5 text-rose-900 dark:text-rose-200 ${className}`}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-semibold text-sm text-rose-950 dark:text-rose-100">{title}</h4>
            {status && (
              <span className="px-1.5 py-0.5 text-xs font-mono font-bold bg-rose-500/20 text-rose-700 dark:text-rose-300 rounded border border-rose-500/30">
                HTTP {status}
              </span>
            )}
            <span className="px-1.5 py-0.5 text-xs font-mono bg-rose-500/10 text-rose-700 dark:text-rose-300 rounded">
              [{code}]
            </span>
          </div>

          <p className="mt-1 text-xs text-rose-800 dark:text-rose-300 leading-relaxed font-mono break-all">
            {message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-rose-700/80 dark:text-rose-400/80">
            {failedEndpoint && (
              <div>
                <span className="font-medium text-rose-900 dark:text-rose-300">Endpoint:</span>{' '}
                <code className="font-mono">{failedEndpoint}</code>
              </div>
            )}
            <div>
              <span className="font-medium text-rose-900 dark:text-rose-300">Failed at:</span>{' '}
              {formatDate(timestamp)}
            </div>
          </div>

          {onRetry && (
            <div className="mt-4">
              <button
                type="button"
                onClick={onRetry}
                disabled={isRefetching}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
                {isRefetching ? 'Retrying...' : 'Retry Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
