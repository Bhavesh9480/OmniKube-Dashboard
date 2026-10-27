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
import { PodItem } from '../../api/types'
import { StatusBadge } from '../common/StatusBadge'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { formatRelativeTime } from '../../utils/formatters'
import { Search, ChevronDown, ChevronUp, Layers, Eye } from 'lucide-react'

interface PodsTableProps {
  pods: PodItem[]
  isLoading?: boolean
}

export const PodsTable: React.FC<PodsTableProps> = ({ pods = [], isLoading: _isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [selectedPhase, setSelectedPhase] = useState<string>('all')
  const [attentionOnly, setAttentionOnly] = useState<boolean>(false)
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedPod, setInspectedPod] = useState<PodItem | null>(null)

  // Extract unique namespaces from real data
  const namespaces = useMemo(() => {
    const set = new Set<string>()
    pods.forEach((p) => {
      if (p.namespace) set.add(p.namespace)
    })
    return Array.from(set).sort()
  }, [pods])

  // Extract unique phases
  const phases = useMemo(() => {
    const set = new Set<string>()
    pods.forEach((p) => {
      if (p.phase) set.add(p.phase)
    })
    return Array.from(set).sort()
  }, [pods])

  // Filter pods
  const filteredData = useMemo(() => {
    return pods.filter((pod) => {
      if (selectedNamespace !== 'all' && pod.namespace !== selectedNamespace) {
        return false
      }
      if (selectedPhase !== 'all' && pod.phase !== selectedPhase) {
        return false
      }
      if (attentionOnly && !pod.isUnhealthy && !pod.isTerminating) {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          pod.name.toLowerCase().includes(query) ||
          pod.namespace.toLowerCase().includes(query) ||
          (pod.node && pod.node.toLowerCase().includes(query)) ||
          pod.reason.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [pods, selectedNamespace, selectedPhase, attentionOnly, globalFilter])

  const columns = useMemo<ColumnDef<PodItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Pod Name',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs truncate">
              {row.original.name}
            </span>
            <span className="text-[11px] text-slate-500 font-mono truncate">
              {row.original.podIP ? `IP: ${row.original.podIP}` : 'No Pod IP'}
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
        accessorKey: 'phase',
        header: 'Phase',
        cell: ({ row }) => <StatusBadge status={row.original.phase} />,
      },
      {
        accessorKey: 'readyContainers',
        header: 'Ready',
        cell: ({ row }) => {
          const { readyContainers, totalContainers } = row.original
          const allReady = readyContainers === totalContainers && totalContainers > 0
          return (
            <span
              className={`font-mono text-xs font-medium ${
                allReady ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {readyContainers}/{totalContainers}
            </span>
          )
        },
      },
      {
        accessorKey: 'restarts',
        header: 'Restarts',
        cell: ({ row }) => (
          <span
            className={`font-mono text-xs ${
              row.original.restarts > 0 ? 'text-amber-500 font-bold' : 'text-slate-500'
            }`}
          >
            {row.original.restarts}
          </span>
        ),
      },
      {
        accessorKey: 'node',
        header: 'Node',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-slate-600 dark:text-slate-400 truncate max-w-[120px] inline-block">
            {row.original.node || 'Unscheduled'}
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
        accessorKey: 'reason',
        header: 'Reason / Status',
        cell: ({ row }) => {
          const { reason, isUnhealthy, isTerminating } = row.original
          if (isUnhealthy || isTerminating) {
            return (
              <span className="px-2 py-0.5 text-[11px] font-mono font-medium rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                {reason || (isTerminating ? 'Terminating' : 'Unhealthy')}
              </span>
            )
          }
          return <span className="text-xs text-slate-500 font-mono">{reason || 'Healthy'}</span>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspectedPod(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect raw pod metadata"
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
      {/* Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search pods, nodes, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Namespace Filter */}
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

          {/* Phase Filter */}
          <select
            value={selectedPhase}
            onChange={(e) => setSelectedPhase(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Phases</option>
            {phases.map((ph) => (
              <option key={ph} value={ph}>
                {ph}
              </option>
            ))}
          </select>

          {/* Attention Filter */}
          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={attentionOnly}
              onChange={(e) => setAttentionOnly(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span>Requires Attention</span>
          </label>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredData.length} of {pods.length} pods
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No pods found"
              description="No pods match your current search and filter criteria."
              icon={<Layers className="w-5 h-5 text-slate-400" />}
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

        {/* Pagination Bar */}
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

      {/* Detail Modal */}
      <ResourceDetailModal
        title={inspectedPod ? `Pod: ${inspectedPod.name}` : ''}
        subtitle={inspectedPod ? `Namespace: ${inspectedPod.namespace} | Node: ${inspectedPod.node || 'None'}` : ''}
        data={inspectedPod}
        isOpen={Boolean(inspectedPod)}
        onClose={() => setInspectedPod(null)}
      />
    </div>
  )
}
