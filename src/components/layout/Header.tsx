import React from 'react'
import { Sun, Moon, RefreshCw, Activity, Radio } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'
import { useWebSocket } from '../../context/WebSocketContext'
import { useSummary } from '../../api/queries'
import { useQueryClient } from '@tanstack/react-query'
import { formatRelativeTime } from '../../utils/formatters'
import { StatusBadge } from '../common/StatusBadge'

interface HeaderProps {
  onToggleSidebar?: () => void
}

export const Header: React.FC<HeaderProps> = () => {
  const { theme, toggleTheme } = useTheme()
  const { state: wsState, reconnect } = useWebSocket()
  const { data: summary, isFetching, refetch } = useSummary()
  const queryClient = useQueryClient()

  const handleManualRefresh = () => {
    queryClient.invalidateQueries()
    refetch()
  }

  const lastSync = summary?.cluster?.lastSuccessfulSync

  const getWsBadge = () => {
    switch (wsState) {
      case 'Connected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live (WS)
          </span>
        )
      case 'Reconnecting':
        return (
          <button
            type="button"
            onClick={reconnect}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition cursor-pointer"
            title="Click to force reconnect"
          >
            <Radio className="w-3 h-3 animate-spin text-amber-500" />
            Reconnecting
          </button>
        )
      default:
        return (
          <button
            type="button"
            onClick={reconnect}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition cursor-pointer"
            title="Click to reconnect"
          >
            <Radio className="w-3 h-3 text-rose-500" />
            Disconnected
          </button>
        )
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <h1 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white uppercase hidden sm:inline-block">
            OmnniKube
          </h1>
        </div>

        {/* Cluster Overall Health Status */}
        {summary?.status && (
          <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-4">
            <span className="text-xs text-slate-500 dark:text-slate-400 hidden md:inline">Cluster Health:</span>
            <StatusBadge status={summary.status} />
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Real-time WebSocket Status */}
        {getWsBadge()}

        {/* Last Sync Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 border-l border-slate-200 dark:border-slate-800 pl-3">
          <span>Synced:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
            {formatRelativeTime(lastSync)}
          </span>
        </div>

        {/* Manual Refresh Button */}
        <button
          type="button"
          onClick={handleManualRefresh}
          disabled={isFetching}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
          title="Force refresh all cluster resources"
          aria-label="Refresh data"
        >
          <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin text-blue-500' : ''}`} />
        </button>

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
