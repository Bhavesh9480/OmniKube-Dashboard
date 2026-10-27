import React from 'react'
import { EventItem } from '../../api/types'
import { EmptyState } from '../common/EmptyState'
import { formatRelativeTime } from '../../utils/formatters'
import { BellRing, AlertTriangle, Info } from 'lucide-react'

interface EventTimelineProps {
  events?: EventItem[]
  maxItems?: number
}

export const EventTimeline: React.FC<EventTimelineProps> = ({ events = [], maxItems = 6 }) => {
  if (!events || events.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Live Cluster Events Feed
        </h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="No recent events"
            description="No recent Kubernetes events have been recorded."
            icon={<BellRing className="w-5 h-5 text-slate-400" />}
          />
        </div>
      </div>
    )
  }

  const displayedEvents = events.slice(0, maxItems)

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col h-80 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Live Cluster Events Feed
          </h3>
          <p className="text-xs text-slate-500 font-mono">
            Real incoming events from cluster watcher ({events.length} tracked)
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-xs">
        {displayedEvents.map((ev, idx) => {
          const isWarning = ev.type?.toLowerCase() === 'warning'
          const time = ev.lastTimestamp || ev.firstTimestamp

          return (
            <div
              key={`${ev.namespace}-${ev.name}-${idx}`}
              className="flex items-start gap-3 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 transition"
            >
              <div className="mt-0.5 shrink-0">
                {isWarning ? (
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                ) : (
                  <Info className="w-4 h-4 text-blue-500" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {ev.reason}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    {formatRelativeTime(time)}
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
                  {ev.message}
                </p>

                <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                  <span className="px-1 py-0.2 bg-slate-200 dark:bg-slate-800 rounded">
                    {ev.targetKind}: {ev.targetName}
                  </span>
                  <span>ns: {ev.namespace}</span>
                  {ev.count > 1 && <span>(x{ev.count})</span>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
