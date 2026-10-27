import React from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { AlertItem } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { ShieldCheck } from 'lucide-react'

interface AlertSeverityDonutProps {
  alerts?: AlertItem[]
}

const SEVERITY_COLORS = {
  critical: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
}

export const AlertSeverityDonut: React.FC<AlertSeverityDonutProps> = ({ alerts = [] }) => {
  const activeAlerts = alerts.filter((a) => a.status === 'active')

  if (activeAlerts.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Active Alert Severities
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="Zero active alerts"
            description="No active critical, warning, or informational alerts detected."
            icon={<ShieldCheck className="w-5 h-5 text-emerald-500" />}
          />
        </div>
      </div>
    )
  }

  const criticalCount = activeAlerts.filter((a) => a.severity === 'critical').length
  const warningCount = activeAlerts.filter((a) => a.severity === 'warning').length
  const infoCount = activeAlerts.filter((a) => a.severity === 'info').length

  const data = [
    { name: 'Critical', value: criticalCount, color: SEVERITY_COLORS.critical },
    { name: 'Warning', value: warningCount, color: SEVERITY_COLORS.warning },
    { name: 'Info', value: infoCount, color: SEVERITY_COLORS.info },
  ].filter((item) => item.value > 0)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80 shadow-sm">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
          Active Alert Severities
        </h3>
        <p className="text-xs text-slate-500 font-mono">
          {activeAlerts.length} active {activeAlerts.length === 1 ? 'incident' : 'incidents'}
        </p>
      </div>

      <div className="flex-1 flex items-center justify-between min-h-0">
        <div className="w-1/2 h-full min-h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={data.length > 1 ? 4 : 0}
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
                    return (
                      <div className="rounded-lg bg-slate-900 border border-slate-800 p-2 text-xs shadow-lg font-mono">
                        <div className="text-slate-200 font-bold">{item.name}</div>
                        <div className="text-amber-400">{item.value} alerts</div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-1/2 pl-4 space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              Critical
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{criticalCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              Warning
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{warningCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              Info
            </span>
            <span className="font-bold text-slate-900 dark:text-slate-200">{infoCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
