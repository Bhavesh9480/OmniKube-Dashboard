/**
 * Strict TypeScript types representing backend data contracts.
 * Derived directly from Zod schemas to ensure 100% type safety and runtime validation parity.
 */
import { z } from 'zod'
import {
  ClusterStatusSchema,
  PodsSummarySchema,
  DeploymentsSummarySchema,
  ServicesSummarySchema,
  AlertsSummarySchema,
  SummaryResponseSchema,
  ContainerItemSchema,
  PodItemSchema,
  PodsListResponseSchema,
  DeploymentItemSchema,
  DeploymentsListResponseSchema,
  AlertItemSchema,
  AlertsListResponseSchema,
  ServiceItemSchema,
  ServicesListResponseSchema,
  EndpointSliceItemSchema,
  EndpointSlicesListResponseSchema,
  EventItemSchema,
  EventsListResponseSchema,
  DetailedHealthResponseSchema,
  MetricsStatusResponseSchema,
} from './schemas'

export type ClusterStatus = z.infer<typeof ClusterStatusSchema>
export type PodsSummary = z.infer<typeof PodsSummarySchema>
export type DeploymentsSummary = z.infer<typeof DeploymentsSummarySchema>
export type ServicesSummary = z.infer<typeof ServicesSummarySchema>
export type AlertsSummary = z.infer<typeof AlertsSummarySchema>
export type SummaryResponse = z.infer<typeof SummaryResponseSchema>
export type ClusterHealthStatus = SummaryResponse['status']

export type ContainerItem = z.infer<typeof ContainerItemSchema>
export type PodItem = z.infer<typeof PodItemSchema>
export type PodsListResponse = z.infer<typeof PodsListResponseSchema>

export type DeploymentItem = z.infer<typeof DeploymentItemSchema>
export type DeploymentsListResponse = z.infer<typeof DeploymentsListResponseSchema>

export type AlertItem = z.infer<typeof AlertItemSchema>
export type AlertsListResponse = z.infer<typeof AlertsListResponseSchema>
export type AlertSeverity = AlertItem['severity']
export type AlertStatus = AlertItem['status']

export interface ServicePortItem {
  name?: string | null
  port?: number | null
  targetPort?: any
  protocol?: string | null
  nodePort?: number | null
}

export type ServiceItem = z.infer<typeof ServiceItemSchema>
export type ServicesListResponse = z.infer<typeof ServicesListResponseSchema>

export interface EndpointCondition {
  ready: boolean
  serving: boolean
  terminating: boolean
}

export interface EndpointTargetRef {
  kind?: string
  name?: string
  namespace?: string
}

export interface EndpointItem {
  addresses: string[]
  ready: boolean
  serving: boolean
  terminating: boolean
  nodeName: string | null
  targetRef: EndpointTargetRef | null
}

export type EndpointSliceItem = z.infer<typeof EndpointSliceItemSchema>
export type EndpointSlicesListResponse = z.infer<typeof EndpointSlicesListResponseSchema>

export type EventItem = z.infer<typeof EventItemSchema>
export type EventsListResponse = z.infer<typeof EventsListResponseSchema>

export type DetailedHealthResponse = z.infer<typeof DetailedHealthResponseSchema>
export type MetricsStatusResponse = z.infer<typeof MetricsStatusResponseSchema>

// WebSocket Envelope Types
export type WsMessageType =
  | 'snapshot'
  | 'resource_updated'
  | 'resource_deleted'
  | 'alert_created'
  | 'alert_updated'
  | 'alert_resolved'
  | 'heartbeat'
  | 'sync_status'
  | 'resources_synced'
  | 'event_created'
  | 'pong'

export interface WsSnapshotPayload {
  summary: SummaryResponse | null
  pods: PodItem[]
  deployments: DeploymentItem[]
  services: ServiceItem[]
  endpointslices: EndpointSliceItem[]
  alerts: AlertItem[]
  events: EventItem[]
  cacheFresh: boolean
  initialSyncCompleted: boolean
  lastSuccessfulSync: string | null
}

export interface WsEnvelope {
  type: WsMessageType
  timestamp: string
  data?: any
  resourceKind?: string
  namespace?: string
  name?: string
  status?: string
  cacheFresh?: boolean
  ageSeconds?: number | null
  lastSuccessfulSync?: string | null
}
