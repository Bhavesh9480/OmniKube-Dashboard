import React from 'react'
import { useAlerts } from '../api/queries'
import { AlertsTable } from '../components/tables/AlertsTable'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { AlertOctagon } from 'lucide-react'

export const AlertsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useAlerts()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Incident & Alert Center
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Deterministic alert evaluation engine with automatic problem resolution and bounded history
          </p>
        </div>
      </div>

      {isError && (
        <ErrorState
          error={error}
          title="Failed to Retrieve Alerts"
          endpoint="/api/alerts"
          onRetry={refetch}
          isRefetching={isFetching}
        />
      )}

      {isLoading && !data ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <LoadingSkeleton rows={6} height="h-10" />
        </div>
      ) : (
        <AlertsTable alerts={data?.items || []} isLoading={isFetching} />
      )}
    </div>
  )
}
