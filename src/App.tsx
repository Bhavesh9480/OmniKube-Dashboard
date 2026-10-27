import React, { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from './context/ConfigContext'
import { ThemeProvider } from './context/ThemeContext'
import { WebSocketProvider } from './context/WebSocketContext'
import { Layout } from './components/layout/Layout'
import { NavTab } from './components/layout/Sidebar'
import { OverviewPage } from './pages/OverviewPage'
import { PodsPage } from './pages/PodsPage'
import { DeploymentsPage } from './pages/DeploymentsPage'
import { ServicesPage } from './pages/ServicesPage'
import { EndpointSlicesPage } from './pages/EndpointSlicesPage'
import { AlertsPage } from './pages/AlertsPage'
import { EventsPage } from './pages/EventsPage'
import { DiagnosticsPage } from './pages/DiagnosticsPage'
import { SettingsPage } from './pages/SettingsPage'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      staleTime: 10000,
    },
  },
})

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview')

  const renderActiveTab = () => {
    switch (currentTab) {
      case 'overview':
        return <OverviewPage />
      case 'pods':
        return <PodsPage />
      case 'deployments':
        return <DeploymentsPage />
      case 'services':
        return <ServicesPage />
      case 'endpointslices':
        return <EndpointSlicesPage />
      case 'alerts':
        return <AlertsPage />
      case 'events':
        return <EventsPage />
      case 'diagnostics':
        return <DiagnosticsPage />
      case 'settings':
        return <SettingsPage />
      default:
        return <OverviewPage />
    }
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider>
        <ThemeProvider>
          <WebSocketProvider>
            <Layout currentTab={currentTab} onSelectTab={setCurrentTab}>
              {renderActiveTab()}
            </Layout>
          </WebSocketProvider>
        </ThemeProvider>
      </ConfigProvider>
    </QueryClientProvider>
  )
}

export default App
