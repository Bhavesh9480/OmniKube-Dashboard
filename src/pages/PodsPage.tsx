import React from 'react'
import { usePods } from '../api/queries'
import { PodsTable } from '../components/tables/PodsTable'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { Layers } from 'lucide-react'

export const PodsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = usePods()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Pod Inventory & Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Monitored Kubernetes pods across namespaces, nodes, and container lifecycles
          </p>
        </div>
      </div>

      {isError && (
        <ErrorState
          error={error}
          title="Failed to Retrieve Pods"
          endpoint="/api/pods"
          onRetry={refetch}
          isRefetching={isFetching}
        />
      )}

      {isLoading && !data ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <LoadingSkeleton rows={8} height="h-10" />
        </div>
      ) : (
        <PodsTable pods={data?.items || []} isLoading={isFetching} />
      )}
    </div>
  )
}
