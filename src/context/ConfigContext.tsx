import React, { createContext, useContext, useState } from 'react'

interface ConfigContextType {
  apiBaseUrl: string
  setApiBaseUrl: (url: string) => void
  pollingIntervalMs: number
  setPollingIntervalMs: (ms: number) => void
  isCustomUrlActive: boolean
}

const ConfigContext = createContext<ConfigContextType>({
  apiBaseUrl: '',
  setApiBaseUrl: () => {},
  pollingIntervalMs: 10000,
  setPollingIntervalMs: () => {},
  isCustomUrlActive: false,
})

export const ConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [apiBaseUrl, setApiBaseUrlState] = useState<string>(() => {
    return localStorage.getItem('k8s_api_base_url') || ''
  })
  const [pollingIntervalMs, setPollingIntervalMsState] = useState<number>(() => {
    const saved = localStorage.getItem('k8s_polling_ms')
    return saved ? parseInt(saved, 10) : 10000
  })

  const setApiBaseUrl = (url: string) => {
    setApiBaseUrlState(url)
    localStorage.setItem('k8s_api_base_url', url)
  }

  const setPollingIntervalMs = (ms: number) => {
    setPollingIntervalMsState(ms)
    localStorage.setItem('k8s_polling_ms', String(ms))
  }

  return (
    <ConfigContext.Provider
      value={{
        apiBaseUrl,
        setApiBaseUrl,
        pollingIntervalMs,
        setPollingIntervalMs,
        isCustomUrlActive: Boolean(apiBaseUrl && apiBaseUrl.trim() !== ''),
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  return useContext(ConfigContext)
}
