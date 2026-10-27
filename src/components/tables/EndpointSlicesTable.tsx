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
import { EndpointSliceItem } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { ResourceDetailModal } from '../common/ResourceDetailModal'
import { Search, ChevronDown, ChevronUp, Share2, Eye } from 'lucide-react'

interface EndpointSlicesTableProps {
  slices: EndpointSliceItem[]
  isLoading?: boolean
}

export const EndpointSlicesTable: React.FC<EndpointSlicesTableProps> = ({
  slices = [],
  isLoading: _isLoading = false,
}) => {
  const [globalFilter, setGlobalFilter] = useState('')
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [inspectedSlice, setInspectedSlice] = useState<EndpointSliceItem | null>(null)

  const namespaces = useMemo(() => {
    const set = new Set<string>()
    slices.forEach((s) => {
      if (s.namespace) set.add(s.namespace)
    })
    return Array.from(set).sort()
  }, [slices])

  const filteredData = useMemo(() => {
    return slices.filter((s) => {
      if (selectedNamespace !== 'all' && s.namespace !== selectedNamespace) {
        return false
      }
      if (globalFilter.trim() !== '') {
        const query = globalFilter.toLowerCase()
        return (
          s.name.toLowerCase().includes(query) ||
          s.namespace.toLowerCase().includes(query) ||
          (s.serviceName && s.serviceName.toLowerCase().includes(query))
        )
      }
      return true
    })
  }, [slices, selectedNamespace, globalFilter])

  const columns = useMemo<ColumnDef<EndpointSliceItem>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'EndpointSlice Name',
        cell: ({ row }) => (
          <span className="font-semibold text-slate-900 dark:text-slate-100 font-mono text-xs truncate">
            {row.original.name}
          </span>
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
        accessorKey: 'serviceName',
        header: 'Service',
        cell: ({ row }) => (
          <span className="text-xs font-mono font-medium text-blue-600 dark:text-blue-400">
            {row.original.serviceName || 'None'}
          </span>
        ),
      },
      {
        accessorKey: 'addressType',
        header: 'Address Type',
        cell: ({ row }) => (
          <span className="px-2 py-0.5 text-[11px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {row.original.addressType}
          </span>
        ),
      },
      {
        accessorKey: 'readyCount',
        header: 'Ready / Total',
        cell: ({ row }) => {
          const { readyCount, totalEndpoints } = row.original
          const allReady = readyCount === totalEndpoints && totalEndpoints > 0
          return (
            <span
              className={`font-mono text-xs font-medium ${
                allReady ? 'text-emerald-500' : 'text-amber-500'
              }`}
            >
              {readyCount}/{totalEndpoints}
            </span>
          )
        },
      },
      {
        accessorKey: 'endpoints',
        header: 'Discovered Endpoints',
        cell: ({ row }) => {
          const endpoints = row.original.endpoints || []
          if (endpoints.length === 0) return <span className="text-slate-400 text-xs">0 endpoints</span>

          const addresses: string[] = []
          endpoints.forEach((ep) => {
            if (Array.isArray(ep.addresses)) addresses.push(...ep.addresses)
          })

          return (
            <div className="flex flex-wrap gap-1 max-w-[200px]">
              {addresses.slice(0, 2).map((addr, idx) => (
                <span
                  key={idx}
                  className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  {addr}
                </span>
              ))}
              {addresses.length > 2 && (
                <span className="text-[10px] text-slate-500 font-mono">+{addresses.length - 2} more</span>
              )}
            </div>
          )
        },
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setInspectedSlice(row.original)}
            className="p-1.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Inspect raw EndpointSlice metadata"
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
              placeholder="Search EndpointSlices..."
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
        </div>

        <div className="text-xs font-mono text-slate-500">
          Showing {filteredData.length} of {slices.length} EndpointSlices
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-sm overflow-hidden">
        {filteredData.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No EndpointSlices found"
              description="No EndpointSlices match your current search and filter criteria."
              icon={<Share2 className="w-5 h-5 text-slate-400" />}
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
        title={inspectedSlice ? `EndpointSlice: ${inspectedSlice.name}` : ''}
        subtitle={inspectedSlice ? `Namespace: ${inspectedSlice.namespace} | Service: ${inspectedSlice.serviceName || 'None'}` : ''}
        data={inspectedSlice}
        isOpen={Boolean(inspectedSlice)}
        onClose={() => setInspectedSlice(null)}
      />
    </div>
  )
}
