/**
 * Formatting and display helper utilities for Kubernetes observability data.
 */

export function formatDate(isoString: string | null | undefined): string {
  if (!isoString) return 'Unavailable'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Invalid date'
    return d.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  } catch {
    return 'Invalid date'
  }
}

export function formatRelativeTime(isoString: string | null | undefined): string {
  if (!isoString) return 'Unavailable'
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return 'Invalid date'
    const now = new Date()
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000)

    if (diffSec < 0) return 'Just now'
    if (diffSec < 5) return 'Just now'
    if (diffSec < 60) return `${diffSec}s ago`
    const diffMin = Math.floor(diffSec / 60)
    if (diffMin < 60) return `${diffMin}m ago`
    const diffHours = Math.floor(diffMin / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d ago`
  } catch {
    return 'Invalid date'
  }
}

export function formatAgeSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) return 'Unknown'
  if (seconds < 60) return `${Math.round(seconds)}s`
  const mins = Math.floor(seconds / 60)
  const remSec = Math.round(seconds % 60)
  return `${mins}m ${remSec}s`
}

export function getStatusTheme(status: string | undefined): {
  bg: string
  text: string
  border: string
  indicator: string
} {
  switch (status?.toLowerCase()) {
    case 'healthy':
    case 'ready':
    case 'running':
    case 'active':
    case 'ok':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-500/20 dark:border-emerald-500/30',
        indicator: 'bg-emerald-500',
      }
    case 'warning':
    case 'pending':
    case 'terminating':
    case 'degraded':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/15',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-500/20 dark:border-amber-500/30',
        indicator: 'bg-amber-500',
      }
    case 'critical':
    case 'failed':
    case 'unhealthy':
    case 'crashloopbackoff':
    case 'imagepullbackoff':
    case 'error':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/15',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-500/20 dark:border-rose-500/30',
        indicator: 'bg-rose-500',
      }
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/15',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/20 dark:border-slate-500/30',
        indicator: 'bg-slate-400',
      }
  }
}
