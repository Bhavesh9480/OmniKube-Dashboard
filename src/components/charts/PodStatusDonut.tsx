import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { PodsSummary } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { PieChart as PieIcon } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatters'

interface PodStatusDonutProps {
  summary?: PodsSummary | null
  lastUpdated?: string | null
  isStale?: boolean
}

const PHASE_COLORS: Record<string, string> = {
  Running: '#10b981', // Emerald
  Pending: '#f59e0b', // Amber
  Failed: '#ef4444',  // Red
  Unknown: '#64748b', // Slate
  Terminating: '#8b5cf6', // Violet
}

export const PodStatusDonut: React.FC<PodStatusDonutProps> = ({
  summary,
  lastUpdated,
  isStale = false,
}) => {
  if (!summary || summary.total === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Pod Phase Distribution
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No pods found"
            description="The cluster reported 0 pods in monitored namespaces."
            icon={<PieIcon className="w-5 h-5 text-slate-400" />}
          />
        </div>
      </div>
    )
  }

  // Construct chart segments ONLY from real non-zero values
  const data = [
    { name: 'Running', value: summary.running, color: PHASE_COLORS.Running },
    { name: 'Pending', value: summary.pending, color: PHASE_COLORS.Pending },
    { name: 'Failed', value: summary.failed, color: PHASE_COLORS.Failed },
    { name: 'Terminating', value: summary.terminating, color: PHASE_COLORS.Terminating },
    { name: 'Unknown', value: summary.unknown, color: PHASE_COLORS.Unknown },
  ].filter((item) => item.value > 0)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Pod Phase Distribution
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            {summary.total} total monitored {summary.total === 1 ? 'pod' : 'pods'}
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400 font-mono">
            Synced {formatRelativeTime(lastUpdated)}
            {isStale && ' (stale)'}
          </span>
        )}
      </div>

      <div className="flex-1 flex items-center justify-between min-h-0">
        {/* Donut Chart */}
        <div className="w-1/2 h-full min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0]
                    const pct = summary.total > 0 ? ((Number(item.value) / summary.total) * 100).toFixed(1) : '0'
                    return (
                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs shadow-lg font-mono">
                        <div className="text-slate-300 font-bold">{item.name}</div>
                        <div className="text-emerald-400">
                          {item.value} pods ({pct}%)
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend with exact real counts */}
        <div className="w-1/2 pl-4 space-y-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              Running
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{summary.running}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Pending
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{summary.pending}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Failed
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{summary.failed}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-500" />
              Terminating
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{summary.terminating}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              Unknown
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{summary.unknown}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
