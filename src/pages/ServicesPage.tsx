import React from 'react'
import { useServices } from '../api/queries'
import { ServicesTable } from '../components/tables/ServicesTable'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { Network } from 'lucide-react'

export const ServicesPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useServices()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Services & Backend Health
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Service selectors, cluster IPs, and associated ready EndpointSlices
          </p>
        </div>
      </div>

      {isError && (
        <ErrorState
          error={error}
          title="Failed to Retrieve Services"
          endpoint="/api/services"
          onRetry={refetch}
          isRefetching={isFetching}
        />
      )}

      {isLoading && !data ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <LoadingSkeleton rows={6} height="h-10" />
        </div>
      ) : (
        <ServicesTable services={data?.items || []} isLoading={isFetching} />
      )}
    </div>
  )
}
