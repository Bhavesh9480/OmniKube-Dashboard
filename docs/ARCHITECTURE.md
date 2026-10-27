# OmnniKube — Functional Architecture & Technical Design

## 1. Architectural Philosophy

OmnniKube is a real-time observability frontend designed for mission-critical Kubernetes environments. The architecture is guided by three non-negotiable principles:

1. **Deterministic Truth (Zero Fake Data):** Every displayed metric, phase badge, table row, and chart slice is bound directly to an authoritative Kubernetes object received from the monitoring agent. Missing or uncollected data is rendered transparently with explicit error, unconfigured, or disconnected notices.
2. **Push-First with Seamless Pull Fallback:** Telemetry is streamed over a low-overhead WebSocket channel with a snapshot-plus-deltas paradigm. If the stream disconnects, the system degrades gracefully to REST polling without disrupting the operator's view.
3. **End-to-End Type Safety:** Strict schemas define the communication boundaries. Backend Pydantic models are replicated via Zod schemas in TypeScript, validating all network traffic at runtime before it reaches the UI layer.

---

## 2. System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Kubernetes API Server                           │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ K8s Watcher Informers (Pods, Deployments,
                                   │ Services, EndpointSlices, Events)
                                   ▼
┌────────────────────────────────────────────────────────────────────────┐
│            Python FastAPI Kubernetes Monitoring Agent                  │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │                 In-Memory Thread-Safe Cache                    │   │
│   └──────────────────────────────┬─────────────────────────────────┘   │
│                                  │                                     │
│            ┌─────────────────────┴──────────────────────┐              │
│            ▼                                            ▼              │
│   ┌───────────────────┐                        ┌──────────────────┐    │
│   │   REST Routers    │                        │    WebSocket     │    │
│   │   • /api/summary  │                        │   Broadcaster    │    │
│   │   • /api/pods     │                        │  • 15s Heartbeat │    │
│   │   • /api/events   │                        │  • Deltas / Mut  │    │
│   └─────────┬─────────┘                        └────────┬─────────┘    │
└─────────────┼───────────────────────────────────────────┼──────────────┘
              │                                           │
              │ REST Fallback                             │ WebSocket Stream
              ▼                                           ▼
┌────────────────────────────────────────────────────────────────────────┐
│                          OmnniKube Client                              │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                    Network & Protocol Layer                      │  │
│  │   • KubernetesWebSocketClient (Backoff, Jitter, Heartbeats)      │  │
│  │   • ApiClient (fetchWithValidation, AbortController, Timeout)    │  │
│  └──────────────────┬───────────────────────────┬───────────────────┘  │
│                     │                           │                      │
│                     ▼                           ▼                      │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                  Runtime Schema Validation                       │  │
│  │   • Zod Schemas (Summary, Pods, Deployments, Alerts, Events)     │  │
│  │   • Normalization into Typed Domain Models                       │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     State & Cache Layer                          │  │
│  │   • TanStack Query v5 (Optimistic delta updates & invalidation)  │  │
│  │   • WebSocketContext (Real-time connection lifecycle)            │  │
│  │   • ConfigContext (Dynamic API URL & Polling management)         │  │
│  │   • ThemeContext (Dark / Light mode persistence)                 │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
│                                     │                                  │
│                                     ▼                                  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Presentation Layer                           │  │
│  │   • 9 Observability Views (Overview, Pods, Deployments, etc.)    │  │
│  │   • TanStack Table v8 (Multi-column sort, filtering, pagination) │  │
│  │   • Recharts Visualizations (Donuts, Replica Balance Bars)       │  │
│  │   • Honest Fallbacks (MetricsNotice, ErrorState, EmptyState)     │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Communication Protocol

### WebSocket Wire Protocol (`/api/ws`)

Upon establishing a connection, the server pushes an initial snapshot envelope:

```json
{
  "type": "snapshot",
  "timestamp": "2026-10-27T10:00:00Z",
  "data": {
    "summary": { ... },
    "pods": [ ... ],
    "deployments": [ ... ],
    "services": [ ... ],
    "endpointslices": [ ... ],
    "alerts": [ ... ],
    "events": [ ... ],
    "cacheFresh": true,
    "initialSyncCompleted": true,
    "lastSuccessfulSync": "2026-10-27T10:00:00Z"
  }
}
```

Subsequent cluster mutations are broadcast as lightweight differential updates:

| Envelope Type | Payload Data | Trigger Condition |
|---|---|---|
| `resource_updated` | Complete resource item | Pod created/updated, deployment scale, service change |
| `resource_deleted` | Resource identifier | Pod deleted, service removed |
| `alert_created` | Active `AlertItem` | Pod entered CrashLoopBackOff, replica shortage detected |
| `alert_resolved` | Resolved `AlertItem` | Container recovered, replica count reached desired |
| `heartbeat` | Agent timestamp & sync age | Periodic 15-second liveness pulse |
| `event_created` | `EventItem` | Kubernetes warning or normal cluster event recorded |

### Client Reconnection Strategy

The `KubernetesWebSocketClient` implements an exponential backoff algorithm with full jitter:
```ts
t_retry = min(30000, 1000 * 2^(retryCount)) + rand(0, 1000)
```
- Reconnect attempts are surfaced in the header (`Reconnecting...`).
- While offline, TanStack Query automatically polls REST endpoints every 10 seconds.
- Upon reconnect, the server sends a fresh snapshot that reconciles any events missed during disconnection.

---

## 4. State Management & Cache Synchronization

The dashboard utilizes TanStack Query v5 as its global synchronized data store:

```
WebSocket Snapshot
       │
       ├─► queryClient.setQueryData(['summary'], snapshot.summary)
       ├─► queryClient.setQueryData(['pods'], { items: snapshot.pods, count: ... })
       ├─► queryClient.setQueryData(['deployments'], { items: snapshot.deployments, ... })
       └─► queryClient.setQueryData(['alerts'], { items: snapshot.alerts, ... })

WebSocket Delta (resource_updated)
       │
       └─► queryClient.setQueryData(['pods'], (old) => upsertPod(old, updatedPod))
```

This architecture completely eliminates race conditions between WebSocket messages and background REST queries.

---

## 5. UI Component Hierarchy

```
App
├── QueryClientProvider (TanStack Query v5)
└── ConfigProvider (API Base URL & Polling State)
    └── ThemeProvider (Dark / Light Theme)
        └── WebSocketProvider (Live WS Stream & Lifecycle)
            └── Layout
                ├── Sidebar (Navigation & Resource Counters)
                ├── Header (Cluster Health, WS Indicator, Sync Age, Theme Toggle)
                ├── Banner (Disconnected Cluster Warning)
                └── Page Outlet
                    ├── OverviewPage (Donut & Replica charts, Alert feed, Metrics notice)
                    ├── PodsPage (Phase filters, Restarts, PodsTable, ResourceDetailModal)
                    ├── DeploymentsPage (Replica counters, DeploymentsTable)
                    ├── ServicesPage (Type, ClusterIP, Ports, ServicesTable)
                    ├── EndpointSlicesPage (Discovered addresses, EndpointSlicesTable)
                    ├── AlertsPage (Active/Resolved filter, Severity badges, AlertsTable)
                    ├── EventsPage (Chronological stream, Warning tags, EventsTable)
                    ├── DiagnosticsPage (Agent health, Watcher threads, Cache stats)
                    └── SettingsPage (Dynamic backend URL, Polling interval)
```

---

## 6. Security & Production Hardening

- **No Remote Code Execution:** The dashboard is completely read-only. No mutation, restart, or delete actions exist, preventing privilege escalation.
- **Strict Content-Type Validation:** Responses are validated against explicit Zod schemas to mitigate injection and data corruption risks.
- **Dynamic URL Sanitization:** User-specified API endpoints in the Settings view are validated before opening network connections.
