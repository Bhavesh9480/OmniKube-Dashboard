import React, { useMemo, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  ColumnDef,
  flexRender,
  SortingState,
} from '@tanstack/react-table'
import { ServiceItem } from '../../api/types'
import { StatusBadge } from '../common/StatusBadge'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { formatRelativeTime } from '../../utils/formatters'
import { Search, ChevronDown, ChevronUp, Network, Eye } from 'lucide-react'

interface ServicesTableProps {
  services: ServiceItem[]
  isLoading?: boolean
}

export const ServicesTable: React.FC<ServicesTableProps> = ({
  services = [],
  isLoading: _isLoading = false,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [attentionOnly, setAttentionOnly] = useState<boolean>(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedService, setInspectedService] = useState<ServiceItem | null>(null)

  const namespaces = useMemo(() => {
    const set = new Set<string>()
    services.forEach((s) => {
      if (s.namespace) set.add(s.namespace)
    })
    return Array.from(set).sort()
  }, [services])

  const filteredData = useMemo(() => {
    return services.filter((s) => {
      if (selectedNamespace !== 'all' && s.namespace !== selectedNamespace) {
        return false
      }
      if (attentionOnly && !s.withoutReadyEndpoints) {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          s.name.toLowerCase().includes(query) ||
          s.namespace.toLowerCase().includes(query) ||
          s.type.toLowerCase().includes(query) ||
          (s.clusterIP && s.clusterIP.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [services, selectedNamespace, attentionOnly, globalFilter])

  const columns = useMemo<ColumnDef<ServiceItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Service Name',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs truncate">
              {row.original.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              IP: {row.original.clusterIP || 'None (Headless)'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'namespace',
        header: 'Namespace',
        cell: ({ row }) => (
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {row.original.namespace}
          </span>
        ),
      },
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => (
          <span className="px-2 py-0.5 text-xs font-mono font-medium rounded border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300">
            {row.original.type}
          </span>
        ),
      },
      {
        accessorKey: 'ports',
        header: 'Ports',
        cell: ({ row }) => {
          const ports = row.original.ports || []
          if (ports.length === 0) return <span className="text-slate-400 text-xs">None</span>
          return (
            <div className="flex flex-wrap gap-1 max-w-[160px]">
              {ports.slice(0, 2).map((p, i) => (
                <span
                  key={i}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                >
                  {p.port}/{p.protocol || 'TCP'}
                </span>
              ))}
              {ports.length > 2 && (
                <span className="text-[10px] text-slate-500 font-mono">+{ports.length - 2} more</span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'readyEndpoints',
        header: 'Ready Endpoints',
        cell: ({ row }) => {
          const { readyEndpoints, totalEndpoints, withoutReadyEndpoints, expectsEndpoints } = row.original

          if (!expectsEndpoints) {
            return <span className="text-xs text-slate-400 font-mono">N/A (No selector)</span>
          }

          return (
            <div className="flex items-center gap-1.5">
              <span
                className={`font-mono text-xs font-semibold ${
                  withoutReadyEndpoints ? 'text-rose-500 font-bold' : 'text-emerald-500'
                }`}
              >
                {readyEndpoints}/{totalEndpoints}
              </span>
              {withoutReadyEndpoints && (
                <span className="px-1.5 py-0.2 text-[10px] font-mono rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Missing
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'isHealthy',
        header: 'Health',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.isHealthy}
            label={row.original.isHealthy ? 'Healthy' : 'Degraded'}
          />
        ),
      },
      {
        accessorKey: 'createdAt',
        header: 'Age',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-slate-500">
            {formatRelativeTime(row.original.createdAt)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspectedService(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect raw service metadata"
          >
            <Eye className="w-4 h-4" />
          </button>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize: 10 },
    },
  })

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search services, cluster IP..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Namespaces ({namespaces.length})</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(e) => setAttentionOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span>Missing Endpoints Only</span>
          </label>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredData.length} of {services.length} services
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No services found"
              description="No services match your current search and filter criteria."
              icon={<Network className="w-5 h-5 text-slate-400" />}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/80"
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="py-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 cursor-pointer select-none"
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className="flex items-center gap-1">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {header.column.getIsSorted() === 'asc' && (
                            <ChevronUp className="w-3.5 h-3.5" />
                          )}
                          {header.column.getIsSorted() === 'desc' && (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="py-3 px-4 text-xs">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredData.length > 10 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 dark:border-slate-800 text-xs">
            <div className="text-slate-500 font-mono">
              Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <ResourceDetailModal
        title={inspectedService ? `Service: ${inspectedService.name}` : ''}
        subtitle={inspectedService ? `Namespace: ${inspectedService.namespace} | Type: ${inspectedService.type}` : ''}
        data={inspectedService}
        isOpen={Boolean(inspectedService)}
        onClose={() => setInspectedService(null)}
      />
    </div>
  )
}
