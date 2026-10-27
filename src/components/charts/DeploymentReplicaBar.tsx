import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { DeploymentItem } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { Server } from 'lucide-react'

import { formatRelativeTime } from '../../utils/formatters'

interface DeploymentReplicaBarProps {
  deployments?: DeploymentItem[]
  lastUpdated?: string | null
}

export const DeploymentReplicaBar: React.FC<DeploymentReplicaBarProps> = ({
  deployments = [],
  lastUpdated,
}) => {
  if (!deployments || deployments.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Deployment Replicas (Desired vs Available)
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No deployments found"
            description="No deployments were discovered in monitored namespaces."
            icon={<Server className="w-5 h-5 text-slate-400" />}
          />
        </div>
      </div>
    )
  }

  // Format real deployment records for comparison bar chart (top 6 for readability)
  const chartData = deployments.slice(0, 6).map((d) => ({
    name: d.name.length > 14 ? `${d.name.slice(0, 12)}…` : d.name,
    fullName: `${d.namespace}/${d.name}`,
    desired: d.desired,
    ready: d.ready,
    available: d.available,
    unavailable: d.unavailable,
  }))

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Deployment Replicas (Desired vs Available)
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Comparing replica counts across {deployments.length} deployments
          </p>
        </div>
        {lastUpdated && (
          <span className="text-[10px] text-slate-400 font-mono">
            Synced {formatRelativeTime(lastUpdated)}
          </span>
        )}
      </div>

      <div className="flex-1 w-full min-h-0 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} allowDecimals={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload
                  return (
                    <div className="rounded-lg bg-slate-900 border border-slate-800 p-3 text-xs shadow-lg font-mono space-y-1">
                      <div className="font-bold text-slate-200">{data.fullName}</div>
                      <div className="text-blue-400">Desired: {data.desired}</div>
                      <div className="text-emerald-400">Ready: {data.ready}</div>
                      <div className="text-teal-400">Available: {data.available}</div>
                      {data.unavailable > 0 && (
                        <div className="text-rose-400">Unavailable: {data.unavailable}</div>
                      )}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="desired" name="Desired" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="ready" name="Ready" fill="#10b981" radius={[4, 4, 0, 0]} />
            <Bar dataKey="available" name="Available" fill="#14b8a6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="unavailable" name="Unavailable" fill="#ef4444" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
