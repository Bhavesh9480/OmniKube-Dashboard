import React, { useState } from 'react'
import { useConfig } from '../context/ConfigContext'
import { useTheme } from '../context/ThemeContext'
import { useWebSocket } from '../context/WebSocketContext'
import { Settings, Save, Check } from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const {
    apiBaseUrl,
    setApiBaseUrl,
    pollingIntervalMs,
    setPollingIntervalMs,
  } = useConfig()

  const { theme, toggleTheme } = useTheme()
  const { reconnect } = useWebSocket()

  const [inputUrl, setInputUrl] = useState(apiBaseUrl)
  const [inputPolling, setInputPolling] = useState(String(pollingIntervalMs))
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setApiBaseUrl(inputUrl.trim())
    const ms = parseInt(inputPolling, 10)
    if (!isNaN(ms) && ms >= 2000) {
      setPollingIntervalMs(ms)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    reconnect()
  }

  const handleReset = () => {
    setInputUrl('')
    setApiBaseUrl('')
    setInputPolling('10000')
    setPollingIntervalMs(10000)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    reconnect()
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-500" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Application Configuration & Settings
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-mono mt-0.5">
            Backend API endpoints, WebSocket connection parameters, and appearance preferences
          </p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Backend Agent URL */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Kubernetes Monitoring Agent Target
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Specify the backend FastAPI server URL. When blank, the dashboard uses relative paths (proxied to{' '}
            <code className="text-blue-500 font-mono">http://127.0.0.1:9999</code> by Vite).
          </p>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              API Base URL
            </label>
            <input
              type="text"
              value={inputUrl}
              onChange={(e) => setInputUrl(e.target.value)}
              placeholder="e.g. http://127.0.0.1:9999 or https://k8s-agent.internal"
              className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Fallback Polling Interval (Milliseconds)
            </label>
            <input
              type="number"
              min="2000"
              step="1000"
              value={inputPolling}
              onChange={(e) => setInputPolling(e.target.value)}
              className="w-48 px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400">
              Only used when WebSocket connection is completely unavailable.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
            >
              {saved ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
              <span>{saved ? 'Saved & Applied' : 'Save Settings'}</span>
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Reset to Local Defaults
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Appearance & Theme</h3>
          <p className="text-xs text-slate-500">
            Dark theme is the default for low-fatigue observability operations.
          </p>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleTheme}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
            >
              Current: <strong className="capitalize">{theme}</strong> (Click to switch)
            </button>
          </div>
        </div>

        {/* Topology & Integration Reference */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Architecture & Deployment Topology
          </h3>
          <div className="p-4 rounded-lg bg-slate-950 text-emerald-400 font-mono text-xs leading-relaxed overflow-x-auto">
            {`+-----------------------+              +------------------------------+
| Frontend Dashboard    |  WebSocket   | FastAPI Monitoring Agent     |
| (Port 9998)           |------------->| (Port 9999)                  |
| React + TypeScript    |  HTTP REST   | Cache + Watcher Streams      |
+-----------------------+              +--------------+---------------+
                                                      |
                                                      v
                                        +-----------------------------+
                                        | Kubernetes API Server       |
                                        | (kube-apiserver:6443)       |
                                        +-----------------------------+`}
          </div>
          <div className="text-xs text-slate-500 space-y-1">
            <p>
              • <strong>Frontend Port:</strong> Running on port <code className="font-mono text-blue-500">9998</code>.
            </p>
            <p>
              • <strong>Backend Agent:</strong> Listening on port <code className="font-mono text-blue-500">9999</code>.
            </p>
            <p>
              • <strong>Real-time Push:</strong> Native bidirectional WebSocket endpoint at <code className="font-mono">/api/ws</code>.
            </p>
            <p>
              • <strong>Security:</strong> Read-only monitoring; credentials and tokens are never embedded or exposed.
            </p>
          </div>
        </div>
      </form>
    </div>
  )
}
