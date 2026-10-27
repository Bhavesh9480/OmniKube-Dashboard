import React from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { formatRelativeTime } from '../../utils/formatters'

interface MetricsCardProps {
  title: string
  value: number | string | null | undefined
  subtext?: string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger'
  isStale?: boolean
  lastUpdated?: string | null
  className?: string
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtext,
  icon,
  variant = 'default',
  isStale = false,
  lastUpdated,
  className = '',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'text-emerald-600 dark:text-emerald-400'
      case 'warning':
        return 'text-amber-600 dark:text-amber-400'
      case 'danger':
        return 'text-rose-600 dark:text-rose-400'
      default:
        return 'text-slate-900 dark:text-white'
    }
  }

  const displayVal = value !== null && value !== undefined ? value : 'Unavailable'

  return (
    <div
      className={`relative rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 shadow-sm transition hover:border-slate-300 dark:hover:border-slate-700 ${className}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {icon && (
          <span className="text-slate-400 dark:text-slate-500">{icon}</span>
        )}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={`text-2xl font-bold tracking-tight font-mono ${getVariantStyles()}`}>
          {displayVal}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <span>{subtext || '\u00A0'}</span>
        {isStale && (
          <span
            className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium"
            title={lastUpdated ? `Last updated: ${lastUpdated}` : 'Data may be stale'}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Stale</span>
          </span>
        )}
      </div>

      {lastUpdated && (
        <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500">
          <Clock className="w-2.5 h-2.5" />
          <span>Synced {formatRelativeTime(lastUpdated)}</span>
        </div>
      )}
    </div>
  )
}
