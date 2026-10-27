import React, { createContext, useContext, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { wsClient, WsConnectionState } from '../api/websocket'
import { WsEnvelope, WsSnapshotPayload } from '../api/types'
import { queryKeys } from '../api/queries'

interface WebSocketContextType {
  state: WsConnectionState
  details: string | null
  lastMessageTime: number
  reconnect: () => void
}

const WebSocketContext = createContext<WebSocketContextType>({
  state: 'Disconnected',
  details: null,
  lastMessageTime: 0,
  reconnect: () => {},
})

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WsConnectionState>(wsClient.getState())
  const [details, setDetails] = useState<string | null>(null)
  const [lastMessageTime, setLastMessageTime] = useState<number>(Date.now())
  const queryClient = useQueryClient()

  useEffect(() => {
    // Listen to connection state changes
    const unsubState = wsClient.onStateChange((newState, detail) => {
      setState(newState)
      setDetails(detail || null)
      if (newState === 'Connected') {
        // Invalidate queries so fresh server state is reconciled
        queryClient.invalidateQueries({ queryKey: queryKeys.all })
      }
    })

    // Listen to snapshot updates
    const unsubSnapshot = wsClient.on('snapshot', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      const snapshot: WsSnapshotPayload = env.data
      if (!snapshot) return

      if (snapshot.summary) {
        queryClient.setQueryData(queryKeys.summary(), snapshot.summary)
      }
      if (snapshot.pods) {
        queryClient.setQueryData(queryKeys.pods(), { items: snapshot.pods, count: snapshot.pods.length })
      }
      if (snapshot.deployments) {
        queryClient.setQueryData(queryKeys.deployments(), { items: snapshot.deployments, count: snapshot.deployments.length })
      }
      if (snapshot.services) {
        queryClient.setQueryData(queryKeys.services(), { items: snapshot.services, count: snapshot.services.length })
      }
      if (snapshot.endpointslices) {
        queryClient.setQueryData(queryKeys.endpointslices(), { items: snapshot.endpointslices, count: snapshot.endpointslices.length })
      }
      if (snapshot.alerts) {
        queryClient.setQueryData(queryKeys.alerts(), { items: snapshot.alerts, count: snapshot.alerts.length })
      }
      if (snapshot.events) {
        queryClient.setQueryData(queryKeys.events(), { items: snapshot.events, count: snapshot.events.length })
      }
    })

    // Listen to incremental resource updates
    const unsubUpdated = wsClient.on('resource_updated', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      const { resourceKind, data } = env
      if (!data) return

      if (resourceKind === 'Pod') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'pods'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.map((p: any) =>
            p.namespace === data.namespace && p.name === data.name ? data : p
          )
          if (!old.items.some((p: any) => p.namespace === data.namespace && p.name === data.name)) {
            items.push(data)
          }
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'Deployment') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'deployments'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.map((d: any) =>
            d.namespace === data.namespace && d.name === data.name ? data : d
          )
          if (!old.items.some((d: any) => d.namespace === data.namespace && d.name === data.name)) {
            items.push(data)
          }
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'Service') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'services'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.map((s: any) =>
            s.namespace === data.namespace && s.name === data.name ? data : s
          )
          if (!old.items.some((s: any) => s.namespace === data.namespace && s.name === data.name)) {
            items.push(data)
          }
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'EndpointSlice') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'endpointslices'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.map((s: any) =>
            s.namespace === data.namespace && s.name === data.name ? data : s
          )
          if (!old.items.some((s: any) => s.namespace === data.namespace && s.name === data.name)) {
            items.push(data)
          }
          return { ...old, items, count: items.length }
        })
      }
    })

    // Listen to resource deletions
    const unsubDeleted = wsClient.on('resource_deleted', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      const { resourceKind, namespace, name } = env
      if (!namespace || !name) return

      if (resourceKind === 'Pod') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'pods'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.filter((p: any) => !(p.namespace === namespace && p.name === name))
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'Deployment') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'deployments'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.filter((d: any) => !(d.namespace === namespace && d.name === name))
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'Service') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'services'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.filter((s: any) => !(s.namespace === namespace && s.name === name))
          return { ...old, items, count: items.length }
        })
        queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
      } else if (resourceKind === 'EndpointSlice') {
        queryClient.setQueriesData({ queryKey: ['k8s', 'endpointslices'] }, (old: any) => {
          if (!old || !Array.isArray(old.items)) return old
          const items = old.items.filter((s: any) => !(s.namespace === namespace && s.name === name))
          return { ...old, items, count: items.length }
        })
      }
    })

    // Listen to alert events
    const unsubAlertCreated = wsClient.on('alert_created', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      if (!env.data) return
      queryClient.setQueriesData({ queryKey: ['k8s', 'alerts'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        const filtered = old.items.filter((a: any) => a.id !== env.data.id)
        return { ...old, items: [env.data, ...filtered], count: filtered.length + 1 }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
    })

    const unsubAlertResolved = wsClient.on('alert_resolved', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      if (!env.data) return
      queryClient.setQueriesData({ queryKey: ['k8s', 'alerts'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        const items = old.items.map((a: any) => (a.id === env.data.id ? env.data : a))
        return { ...old, items }
      })
      queryClient.invalidateQueries({ queryKey: queryKeys.summary() })
    })

    // Listen to new events
    const unsubEventCreated = wsClient.on('event_created', (env: WsEnvelope) => {
      setLastMessageTime(Date.now())
      if (!env.data) return
      queryClient.setQueriesData({ queryKey: ['k8s', 'events'] }, (old: any) => {
        if (!old || !Array.isArray(old.items)) return old
        return { ...old, items: [env.data, ...old.items], count: old.items.length + 1 }
      })
    })

    // Listen to heartbeats
    const unsubHeartbeat = wsClient.on('heartbeat', () => {
      setLastMessageTime(Date.now())
    })

    // Initiate connection
    wsClient.connect()

    return () => {
      unsubState()
      unsubSnapshot()
      unsubUpdated()
      unsubDeleted()
      unsubAlertCreated()
      unsubAlertResolved()
      unsubEventCreated()
      unsubHeartbeat()
      wsClient.disconnect()
    }
  }, [queryClient])

  return (
    <WebSocketContext.Provider
      value={{
        state,
        details,
        lastMessageTime,
        reconnect: () => wsClient.connect(),
      }}
    >
      {children}
    </WebSocketContext.Provider>
  )
}

export function useWebSocket() {
  return useContext(WebSocketContext)
}
