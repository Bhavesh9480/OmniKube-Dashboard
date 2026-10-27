import { WsEnvelope, WsMessageType } from './types'

export type WsConnectionState = 'Connecting' | 'Connected' | 'Reconnecting' | 'Disconnected'

export type WsEventListener = (envelope: WsEnvelope) => void
export type WsStateListener = (state: WsConnectionState, details?: string) => void

export class KubernetesWebSocketClient {
  private ws: WebSocket | null = null
  private state: WsConnectionState = 'Disconnected'
  private retryCount = 0
  private maxReconnectDelay = 30000
  private baseReconnectDelay = 1000
  private reconnectTimer: any = null
  private heartbeatCheckTimer: any = null
  private pingTimer: any = null
  private lastMessageTime = 0
  private eventListeners: Map<string, Set<WsEventListener>> = new Map()
  private stateListeners: Set<WsStateListener> = new Set()
  private isExplicitlyClosed = false
  private customUrl: string | null = null

  constructor(customUrl?: string) {
    this.customUrl = customUrl || null
  }

  public getState(): WsConnectionState {
    return this.state
  }

  public getLastMessageTime(): number {
    return this.lastMessageTime
  }

  public on(type: WsMessageType | 'all', listener: WsEventListener): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set())
    }
    this.eventListeners.get(type)!.add(listener)
    return () => this.eventListeners.get(type)?.delete(listener)
  }

  public onStateChange(listener: WsStateListener): () => void {
    this.stateListeners.add(listener)
    // Send immediate current state
    listener(this.state)
    return () => this.stateListeners.delete(listener)
  }

  private setState(newState: WsConnectionState, details?: string) {
    if (this.state !== newState) {
      this.state = newState
      this.stateListeners.forEach((fn) => fn(newState, details))
    }
  }

  private resolveWsUrl(): string {
    if (this.customUrl && this.customUrl.trim() !== '') {
      return this.customUrl.trim()
    }
    const envWsUrl = import.meta.env.VITE_WS_URL
    if (envWsUrl && typeof envWsUrl === 'string' && envWsUrl.trim() !== '') {
      return envWsUrl.trim()
    }

    // Check if an API base URL is specified (via Settings or VITE_API_BASE_URL)
    let baseUrl = ''
    if (typeof window !== 'undefined') {
      baseUrl = localStorage.getItem('k8s_api_base_url') || ''
    }
    if (!baseUrl && import.meta.env.VITE_API_BASE_URL) {
      baseUrl = import.meta.env.VITE_API_BASE_URL
    }

    if (baseUrl && baseUrl.trim() !== '') {
      try {
        const parsed = new URL(baseUrl)
        const wsProto = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
        return `${wsProto}//${parsed.host}/api/ws`
      } catch {
        // If relative or ill-formed, continue to window.location fallback
      }
    }

    // Default: derive from window.location (handled by Vite dev proxy if running locally)
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.host
    return `${protocol}//${host}/api/ws`
  }

  public connect(): void {
    this.isExplicitlyClosed = false
    this.cleanupSocket()
    this.setState(this.retryCount === 0 ? 'Connecting' : 'Reconnecting')

    const url = this.resolveWsUrl()

    try {
      this.ws = new WebSocket(url)
    } catch (err: any) {
      this.scheduleReconnect(`Failed to create WebSocket: ${err.message}`)
      return
    }

    this.ws.onopen = () => {
      this.retryCount = 0
      this.lastMessageTime = Date.now()
      this.setState('Connected')
      this.startHeartbeatTimers()
    }

    this.ws.onmessage = (event: MessageEvent) => {
      this.lastMessageTime = Date.now()
      try {
        const payload: WsEnvelope = JSON.parse(event.data)
        this.dispatchMessage(payload)
      } catch {
        // Ignore unparseable non-JSON messages (e.g. raw text ping/pong)
      }
    }

    this.ws.onerror = () => {
      // Browser hides specific error details for security; close event will follow
    }

    this.ws.onclose = (event: CloseEvent) => {
      this.stopHeartbeatTimers()
      if (!this.isExplicitlyClosed) {
        this.scheduleReconnect(`Connection closed (code: ${event.code})`)
      } else {
        this.setState('Disconnected', 'Connection closed normally')
      }
    }
  }

  private dispatchMessage(envelope: WsEnvelope): void {
    const specificListeners = this.eventListeners.get(envelope.type)
    if (specificListeners) {
      specificListeners.forEach((fn) => fn(envelope))
    }
    const allListeners = this.eventListeners.get('all')
    if (allListeners) {
      allListeners.forEach((fn) => fn(envelope))
    }
  }

  private scheduleReconnect(reason?: string): void {
    if (this.isExplicitlyClosed) return

    this.setState('Reconnecting', reason)
    this.cleanupSocket()

    // Bounded exponential backoff with jitter
    const delay = Math.min(
      this.baseReconnectDelay * Math.pow(1.5, this.retryCount) + Math.random() * 500,
      this.maxReconnectDelay
    )
    this.retryCount++

    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  private startHeartbeatTimers(): void {
    this.stopHeartbeatTimers()

    // Send client ping every 20 seconds
    this.pingTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send('ping')
        } catch {
          // Socket might have closed
        }
      }
    }, 20000)

    // Check link liveness every 15 seconds (detect silent disconnects)
    this.heartbeatCheckTimer = setInterval(() => {
      const timeSinceLastMsg = Date.now() - this.lastMessageTime
      // Agent heartbeats every 15s; if no message for 45s, declare dead link
      if (timeSinceLastMsg > 45000 && this.state === 'Connected') {
        this.scheduleReconnect('Heartbeat timeout (no message for >45s)')
      }
    }, 15000)
  }

  private stopHeartbeatTimers(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer)
      this.pingTimer = null
    }
    if (this.heartbeatCheckTimer) {
      clearInterval(this.heartbeatCheckTimer)
      this.heartbeatCheckTimer = null
    }
  }

  private cleanupSocket(): void {
    this.stopHeartbeatTimers()
    if (this.ws) {
      this.ws.onopen = null
      this.ws.onmessage = null
      this.ws.onerror = null
      this.ws.onclose = null
      try {
        this.ws.close()
      } catch {
        // Ignored
      }
      this.ws = null
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    this.cleanupSocket()
    this.setState('Disconnected', 'User initiated disconnect')
  }
}

// Global shared singleton client
export const wsClient = new KubernetesWebSocketClient()
