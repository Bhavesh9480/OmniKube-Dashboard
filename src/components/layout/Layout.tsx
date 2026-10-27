import React, { useState } from 'react'
import { Header } from './Header'
import { Sidebar, NavTab } from './Sidebar'
import { Banner } from './Banner'

interface LayoutProps {
  currentTab: NavTab
  onSelectTab: (tab: NavTab) => void
  children: React.ReactNode
}

export const Layout: React.FC<LayoutProps> = ({ currentTab, onSelectTab, children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={onSelectTab}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapsed={() => setIsSidebarCollapsed((prev) => !prev)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Header onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)} />
        <Banner />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
