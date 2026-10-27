import React from 'react'
import { useEndpointSlices } from '../api/queries'
import { EndpointSlicesTable } from '../components/tables/EndpointSlicesTable'
import { ErrorState } from '../components/common/ErrorState'
import { LoadingSkeleton } from '../components/common/LoadingSkeleton'
import { Share2 } from 'lucide-react'

export const EndpointSlicesPage: React.FC = () => {
  const { data, isLoading, isError, error, refetch, isFetching } = useEndpointSlices()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Discovery EndpointSlices
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Scalable network endpoint topologies tracked by discovery.k8s.io
          </p>
        </div>
      </div>

      {isError && (
        <ErrorState
          error={error}
          title="Failed to Retrieve EndpointSlices"
          endpoint="/api/endpointslices"
          onRetry={refetch}
          isRefetching={isFetching}
        />
      )}

      {isLoading && !data ? (
        <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm space-y-4">
          <LoadingSkeleton rows={6} height="h-10" />
        </div>
      ) : (
        <EndpointSlicesTable slices={data?.items || []} isLoading={isFetching} />
      )}
    </div>
  )
}
