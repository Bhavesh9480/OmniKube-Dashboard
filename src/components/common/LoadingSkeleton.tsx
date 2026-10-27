import React from 'react'

export const LoadingSkeleton: React.FC<{ rows?: number; height?: string; className?: string }> = ({
  rows = 4,
  height = 'h-8',
  className = '',
}) => {
  return (
    <div className={`space-y-2.5 animate-pulse ${className}`} role="status" aria-label="Loading real data">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={`w-full rounded bg-slate-200 dark:bg-slate-800/80 ${height}`}
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
      <span className="sr-only">Loading cluster telemetry...</span>
    </div>
  )
}

export const CardSkeleton: React.FC = () => (
  <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-5 space-y-3 animate-pulse">
    <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded" />
    <div className="h-8 w-16 bg-slate-300 dark:bg-slate-700 rounded" />
    <div className="h-3 w-36 bg-slate-200 dark:bg-slate-800/60 rounded" />
  </div>
)
