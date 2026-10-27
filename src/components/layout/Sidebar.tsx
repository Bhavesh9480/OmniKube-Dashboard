import React from 'react'
import {
  LayoutDashboard,
  Layers,
  Server,
  Network,
  Share2,
  AlertOctagon,
  BellRing,
  HeartPulse,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useSummary, useAlerts } from '../../api/queries'
import { cn } from '../../utils/cn'

export type NavTab =
  | 'overview'
  | 'pods'
  | 'deployments'
  | 'services'
  | 'endpointslices'
  | 'alerts'
  | 'events'
  | 'diagnostics'
  | 'settings'

interface SidebarProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  isCollapsed: boolean
  onToggleCollapsed: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isCollapsed,
  onToggleCollapsed,
}) => {
  const { data: summary } = useSummary()
  const { data: alertsData } = useAlerts()

  // Calculate active alerts count
  const activeAlertsCount =
    alertsData?.items?.filter((a) => a.status === 'active').length ??
    summary?.alerts?.total ??
    0

  const navItems: Array<{
    id: NavTab
    label: string
    icon: React.ReactNode
    badge?: number | string | null
    badgeColor?: string
  }> = [
    {
      id: 'overview',
      label: 'Overview',
      icon: <LayoutDashboard className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'pods',
      label: 'Pods',
      icon: <Layers className="w-5 h-5 shrink-0" />,
      badge: summary?.pods?.total,
    },
    {
      id: 'deployments',
      label: 'Deployments',
      icon: <Server className="w-5 h-5 shrink-0" />,
      badge: summary?.deployments?.total,
    },
    {
      id: 'services',
      label: 'Services',
      icon: <Network className="w-5 h-5 shrink-0" />,
      badge: summary?.services?.total,
    },
    {
      id: 'endpointslices',
      label: 'EndpointSlices',
      icon: <Share2 className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: <AlertOctagon className="w-5 h-5 shrink-0" />,
      badge: activeAlertsCount > 0 ? activeAlertsCount : null,
      badgeColor: 'bg-rose-500 text-white font-bold',
    },
    {
      id: 'events',
      label: 'Events',
      icon: <BellRing className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'diagnostics',
      label: 'Diagnostics',
      icon: <HeartPulse className="w-5 h-5 shrink-0" />,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <Settings className="w-5 h-5 shrink-0" />,
    },
  ]

  return (
    <aside
      className={cn(
        'relative flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 transition-all duration-200 select-none shrink-0 z-20',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-xs shadow-md tracking-tighter">
              OK
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight">
                OmnniKube
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-wide">K8s Observability</span>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onToggleCollapsed}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition mx-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 space-y-1 p-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = currentTab === item.id
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 text-xs font-medium rounded-lg transition text-left group relative',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              {item.icon}

              {!isCollapsed && (
                <span className="flex-1 truncate">{item.label}</span>
              )}

              {!isCollapsed && item.badge !== undefined && item.badge !== null && (
                <span
                  className={cn(
                    'px-1.5 py-0.2 text-[10px] font-mono rounded-full font-medium',
                    isActive
                      ? 'bg-blue-700 text-white'
                      : item.badgeColor || 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Mode Status Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 font-mono">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span>Runtime Port</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">9998</span>
          </div>
        ) : (
          <div className="text-center font-bold">9998</div>
        )}
      </div>
    </aside>
  )
}
