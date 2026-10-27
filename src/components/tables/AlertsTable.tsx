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
import { AlertItem } from '../../api/types'
import { StatusBadge } from '../common/StatusBadge'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { formatRelativeTime } from '../../utils/formatters'
import { Search, ChevronDown, ChevronUp, AlertOctagon, Eye, ShieldAlert } from 'lucide-react'

interface AlertsTableProps {
  alerts: AlertItem[]
  isLoading?: boolean
}

export const AlertsTable: React.FC<AlertsTableProps> = ({ alerts = [], isLoading: _isLoading = false }) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('active')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedAlert, setInspectedAlert] = useState<AlertItem | null>(null)

  const namespaces = useMemo(() => {
    const set = new Set<string>()
    alerts.forEach((a) => {
      if (a.namespace) set.add(a.namespace)
    })
    return Array.from(set).sort()
  }, [alerts])

  const filteredData = useMemo(() => {
    return alerts.filter((a) => {
      if (selectedStatus !== 'all' && a.status !== selectedStatus) {
        return false
      }
      if (selectedSeverity !== 'all' && a.severity !== selectedSeverity) {
        return false
      }
      if (selectedNamespace !== 'all' && a.namespace !== selectedNamespace) {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          a.title.toLowerCase().includes(query) ||
          a.resourceName.toLowerCase().includes(query) ||
          a.namespace.toLowerCase().includes(query) ||
          a.reason.toLowerCase().includes(query) ||
          a.message.toLowerCase().includes(query)
        )
      }
      return true
    })
  }, [alerts, selectedStatus, selectedSeverity, selectedNamespace, globalFilter])

  const columns = useMemo<ColumnDef<AlertItem>[]>(
    () => [
      {
        accessorKey: 'severity',
        header: 'Severity',
        cell: ({ row }) => (
          <StatusBadge
            status={row.original.severity}
            label={row.original.severity.toUpperCase()}
          />
        ),
      },
      {
        accessorKey: 'title',
        header: 'Alert Title & Resource',
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0 max-w-sm">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs truncate">
              {row.original.title}
            </span>
            <span className="text-[11px] text-slate-500 font-mono truncate">
              {row.original.resourceKind}: {row.original.resourceName} ({row.original.reason})
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
        header: 'State',
        cell: ({ row }) => (
          <span
            className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded ${
              row.original.status === 'active'
                ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
            }`}
          >
            {row.original.status}
          </span>
        ),
      },
      {
        accessorKey: 'firstSeen',
        header: 'First Seen',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-slate-500">
            {formatRelativeTime(row.original.firstSeen)}
          </span>
        ),
      },
      {
        accessorKey: 'lastSeen',
        header: 'Last Seen',
        cell: ({ row }) => (
          <span className="text-xs font-mono text-slate-500">
            {formatRelativeTime(row.original.lastSeen)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspectedAlert(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect full alert diagnostic payload"
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
      {/* Read-Only Notice banner per requirements */}
      <div className="flex items-center gap-2 p-3 text-xs rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-slate-500 font-mono">
        <ShieldAlert className="w-4 h-4 text-blue-500 shrink-0" />
        <span>
          Read-Only Incident Center: Alerts are evaluated and automatically resolved directly by the monitoring agent when cluster health recovers.
        </span>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search alert title, resource, reason..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
          >
            <option value="active">Active Incidents</option>
            <option value="resolved">Resolved History</option>
            <option value="all">All Alerts</option>
          </select>

          {/* Severity Filter */}
          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          {/* Namespace Filter */}
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
          Showing {filteredData.length} of {alerts.length} alerts
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title={selectedStatus === 'active' ? 'No active alerts' : 'No alerts recorded'}
              description={
                selectedStatus === 'active'
                  ? 'There are currently no active alerts matching your filters.'
                  : 'No alert history matching filters.'
              }
              icon={<AlertOctagon className="w-5 h-5 text-slate-400" />}
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
        title={inspectedAlert ? inspectedAlert.title : ''}
        subtitle={inspectedAlert ? `ID: ${inspectedAlert.id} | Severity: ${inspectedAlert.severity}` : ''}
        data={inspectedAlert}
        isOpen={Boolean(inspectedAlert)}
        onClose={() => setInspectedAlert(null)}
      />
    </div>
  )
}
