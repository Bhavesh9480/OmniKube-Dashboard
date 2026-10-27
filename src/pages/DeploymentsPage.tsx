import React from 'react'
import { useDeployments } from '../api/queries'
import { DeploymentsTable } from '../components/tables/DeploymentsTable'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { Server } from 'lucide-react'

export const DeploymentsPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useDeployments()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Deployments & Replica Availability
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Desired vs ready replicas, condition tracking, and rollout progress
          </p>
        </div>
      </div>

      {isError && (
        <ErrorState
          error={error}
          title="Failed to Retrieve Deployments"
          endpoint="/api/deployments"
          onRetry={refetch}
          isRefetching={isFetching}
        />
      )}

      {isLoading && !data ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <LoadingSkeleton rows={6} height="h-10" />
        </div>
      ) : (
        <DeploymentsTable deployments={data?.items || []} isLoading={isFetching} />
      )}
    </div>
  )
}
