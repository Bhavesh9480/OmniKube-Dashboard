import React from 'react'
import { Cpu, Info } from 'lucide-react'
import { useMetricsStatus } from '../../api/queries'

export const MetricsNotice: React.FC = () => {
  const { data: metricsStatus } = useMetricsStatus()

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500 shrink-0">
          <Cpu className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Cluster Resource Metrics (CPU, Memory, Disk, Network)
            </h4>
            <span className="px-2 py-0.5 text-[10px] font-mono font-medium rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              Not Configured
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {metricsStatus?.message ||
              'Kubernetes metrics-server or Prometheus integration is required to collect real-time CPU, Memory, Disk, and Network utilization telemetry.'}
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-slate-500 font-mono">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>
              Per strict data integrity guidelines, fictional or estimated metric gauges are omitted.
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
