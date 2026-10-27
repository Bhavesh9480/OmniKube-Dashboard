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
import { EventItem } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { formatRelativeTime } from '../../utils/formatters'
import { Search, ChevronDown, ChevronUp, BellRing, Eye, AlertTriangle, Info } from 'lucide-react'

interface EventsTableProps {
  events: EventItem[]
  isLoading?: boolean
}

export const EventsTable: React.FC<EventsTableProps> = ({ events = [], isLoading: _isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedType, setSelectedType] = useState<string>('all')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedEvent, setInspectedEvent] = useState<EventItem | null>(null)

  const namespaces = useMemo(() => {
    const set = new Set<string>()
    events.forEach((e) => {
      if (e.namespace) set.add(e.namespace)
    })
    return Array.from(set).sort()
  }, [events])

  const filteredData = useMemo(() => {
    return events.filter((e) => {
      if (selectedType !== 'all' && e.type?.toLowerCase() !== selectedType.toLowerCase()) {
        return false
      }
      if (selectedNamespace !== 'all' && e.namespace !== selectedNamespace) {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          e.reason.toLowerCase().includes(query) ||
          e.message.toLowerCase().includes(query) ||
          e.targetName.toLowerCase().includes(query) ||
          e.namespace.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [events, selectedType, selectedNamespace, globalFilter])

  const columns = useMemo<ColumnDef<EventItem>[]>(
    () => [
      {
        accessorKey: 'type',
        header: 'Type',
        cell: ({ row }) => {
          const isWarning = row.original.type?.toLowerCase() === 'warning'
          return (
            <span
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${
                isWarning
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
              }`}
            >
              {isWarning ? <AlertTriangle className="w-3 h-3" /> : <Info className="w-3 h-3" />}
              {row.original.type || 'Normal'}
            </span>
          )
        },
      },
      {
        accessorKey: 'reason',
        header: 'Reason',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs">
            {row.original.reason}
          </span>
        ),
      },
      {
        accessorKey: 'message',
        header: 'Message',
        cell: ({ row }) => (
          <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md truncate" title={row.original.message}>
            {row.original.message}
          </p>
        ),
      },
      {
        accessorKey: 'target',
        header: 'Involved Resource',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0 font-mono text-xs">
            <span className="text-slate-800 dark:text-slate-200 truncate">
              {row.original.targetKind}: {row.original.targetName}
            </span>
            <span className="text-[10px] text-slate-500">ns: {row.original.namespace}</span>
          </div>
        ),
      },
      {
        accessorKey: 'count',
        header: 'Count',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {row.original.count}
          </span>
        ),
      },
      {
        accessorKey: 'lastTimestamp',
        header: 'Last Seen',
        cell: ({ row }) => {
          const time = row.original.lastTimestamp || row.original.firstTimestamp
          return <span className="text-xs font-mono text-slate-500">{formatRelativeTime(time)}</span>
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspectedEvent(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect raw event metadata"
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
              placeholder="Search events, messages..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="all">All Types</option>
            <option value="warning">Warning Events</option>
            <option value="normal">Normal Events</option>
          </select>

          <select
            value={selectedNamespace}
            onChange={(e) => setSelectedNamespace(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Namespaces</option>
            {namespaces.map((ns) => (
              <option key={ns} value={ns}>
                {ns}
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredData.length} of {events.length} events
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No events found"
              description="No Kubernetes events match your current search and filter criteria."
              icon={<BellRing className="w-5 h-5 text-slate-400" />}
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
        title={inspectedEvent ? `Event: ${inspectedEvent.reason}` : ''}
        subtitle={inspectedEvent ? `Namespace: ${inspectedEvent.namespace} | Type: ${inspectedEvent.type}` : ''}
        data={inspectedEvent}
        isOpen={Boolean(inspectedEvent)}
        onClose={() => setInspectedEvent(null)}
      />
    </div>
  )
}
