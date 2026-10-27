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
import { DeploymentItem } from '../../api/types'
import { StatusBadge } from '../common/StatusBadge'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { formatRelativeTime } from '../../utils/formatters'
import { Search, ChevronDown, ChevronUp, Server, Eye } from 'lucide-react'

interface DeploymentsTableProps {
  deployments: DeploymentItem[]
  isLoading?: boolean
}

export const DeploymentsTable: React.FC<DeploymentsTableProps> = ({
  deployments = [],
  isLoading: _isLoading = false,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [attentionOnly, setAttentionOnly] = useState<boolean>(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedDeployment, setInspectedDeployment] = useState<DeploymentItem | null>(null)

  const namespaces = useMemo(() => {
    const set = new Set<string>()
    deployments.forEach((d) => {
      if (d.namespace) set.add(d.namespace)
    })
    return Array.from(set).sort()
  }, [deployments])

  const filteredData = useMemo(() => {
    return deployments.filter((d) => {
      if (selectedNamespace !== 'all' && d.namespace !== selectedNamespace) {
        return false
      }
      if (attentionOnly && d.status === 'healthy') {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          d.name.toLowerCase().includes(query) ||
          d.namespace.toLowerCase().includes(query) ||
          d.reason.toLowerCase().includes(query) ||
          d.status.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [deployments, selectedNamespace, attentionOnly, globalFilter])

  const columns = useMemo<ColumnDef<DeploymentItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Deployment Name',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs truncate">
              {row.original.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono">
              Generation: {row.original.observedGeneration ?? '-'}/{row.original.generation ?? '-'}
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
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <StatusBadge status={row.original.status} label={row.original.status} />
        ),
      },
      {
        accessorKey: 'desired',
        header: 'Desired',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.desired}</span>,
      },
      {
        accessorKey: 'updated',
        header: 'Updated',
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.updated}</span>,
      },
      {
        accessorKey: 'ready',
        header: 'Ready',
        cell: ({ row }) => {
          const isFull = row.original.ready === row.original.desired && row.original.desired > 0
          return (
            <span
              className={`font-mono text-xs font-medium ${
                isFull ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {row.original.ready}
            </span>
          )
        },
      },
      {
        accessorKey: 'available',
        header: 'Available',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-700 dark:text-slate-300">
            {row.original.available}
          </span>
        ),
      },
      {
        accessorKey: 'unavailable',
        header: 'Unavailable',
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs ${
              row.original.unavailable > 0 ? 'text-rose-500 font-bold' : 'text-slate-400'
            }`}
          >
            {row.original.unavailable}
          </span>
        ),
      },
      {
        accessorKey: 'reason',
        header: 'Condition / Reason',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-slate-500 truncate max-w-[150px] inline-block">
            {row.original.reason || 'ReplicaSetReady'}
          </span>
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
            onClick={() => setInspectedDeployment(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect raw deployment metadata"
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
              placeholder="Search deployments..."
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
            <span>Shortages Only</span>
          </label>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredData.length} of {deployments.length} deployments
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No deployments found"
              description="No deployments match your current search and filter criteria."
              icon={<Server className="w-5 h-5 text-slate-400" />}
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
        title={inspectedDeployment ? `Deployment: ${inspectedDeployment.name}` : ''}
        subtitle={inspectedDeployment ? `Namespace: ${inspectedDeployment.namespace}` : ''}
        data={inspectedDeployment}
        isOpen={Boolean(inspectedDeployment)}
        onClose={() => setInspectedDeployment(null)}
      />
    </div>
  )
}
