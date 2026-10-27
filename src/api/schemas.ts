import { z } from 'zod'

export const ClusterStatusSchema = z.object({
  connected: z.boolean(),
  lastSuccessfulSync: z.string().nullable().optional(),
})

export const PodsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  running: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  unknown: z.number().int().nonnegative(),
  terminating: z.number().int().nonnegative(),
  unhealthy: z.number().int().nonnegative(),
})

export const DeploymentsSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  healthy: z.number().int().nonnegative(),
  unhealthy: z.number().int().nonnegative(),
})

export const ServicesSummarySchema = z.object({
  total: z.number().int().nonnegative(),
  withoutReadyEndpoints: z.number().int().nonnegative(),
})

export const AlertsSummarySchema = z.object({
  critical: z.number().int().nonnegative(),
  warning: z.number().int().nonnegative(),
  info: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
})

export const SummaryResponseSchema = z.object({
  status: z.enum(['healthy', 'warning', 'critical', 'unknown']),
  cluster: ClusterStatusSchema,
  pods: PodsSummarySchema,
  deployments: DeploymentsSummarySchema,
  services: ServicesSummarySchema,
  alerts: AlertsSummarySchema,
})

export const ContainerItemSchema = z.object({
  name: z.string(),
  image: z.string(),
  ready: z.boolean(),
  restartCount: z.number().int(),
  state: z.string(),
  reason: z.string().nullable().optional(),
  message: z.string().nullable().optional(),
  exitCode: z.number().int().nullable().optional(),
})

export const PodItemSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  uid: z.string(),
  phase: z.string(),
  node: z.string().nullable().optional(),
  podIP: z.string().nullable().optional(),
  ready: z.boolean(),
  readyContainers: z.number().int(),
  totalContainers: z.number().int(),
  restarts: z.number().int(),
  reason: z.string(),
  containers: z.array(ContainerItemSchema).default([]),
  createdAt: z.string().nullable().optional(),
  deletionTimestamp: z.string().nullable().optional(),
  isTerminating: z.boolean().default(false),
  isUnhealthy: z.boolean().default(false),
})

export const PodsListResponseSchema = z.object({
  items: z.array(PodItemSchema),
  count: z.number().int(),
  continueToken: z.string().nullable().optional(),
})

export const DeploymentItemSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  desired: z.number().int(),
  updated: z.number().int(),
  ready: z.number().int(),
  available: z.number().int(),
  unavailable: z.number().int(),
  status: z.string(),
  reason: z.string(),
  generation: z.number().int().nullable().optional(),
  observedGeneration: z.number().int().nullable().optional(),
  createdAt: z.string().nullable().optional(),
})

export const DeploymentsListResponseSchema = z.object({
  items: z.array(DeploymentItemSchema),
  count: z.number().int(),
  lastUpdated: z.string().nullable().optional(),
})

export const AlertItemSchema = z.object({
  id: z.string(),
  severity: z.enum(['critical', 'warning', 'info']),
  title: z.string(),
  resourceKind: z.string(),
  resourceName: z.string(),
  namespace: z.string(),
  reason: z.string(),
  message: z.string(),
  firstSeen: z.string(),
  lastSeen: z.string(),
  status: z.enum(['active', 'resolved']),
})

export const AlertsListResponseSchema = z.object({
  items: z.array(AlertItemSchema),
  count: z.number().int(),
})

export const ServiceItemSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  type: z.string(),
  clusterIP: z.string().nullable().optional(),
  ports: z.array(z.record(z.any())).default([]),
  selector: z.record(z.string()).default({}),
  createdAt: z.string().nullable().optional(),
  expectsEndpoints: z.boolean().default(true),
  hasSelector: z.boolean().default(true),
  readyEndpoints: z.number().int().default(0),
  totalEndpoints: z.number().int().default(0),
  withoutReadyEndpoints: z.boolean().default(false),
  isHealthy: z.boolean().default(true),
  issues: z.array(z.record(z.any())).default([]),
})

export const ServicesListResponseSchema = z.object({
  items: z.array(ServiceItemSchema),
  count: z.number().int(),
  lastUpdated: z.string().nullable().optional(),
})

export const EndpointSliceItemSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  serviceName: z.string().nullable().optional(),
  addressType: z.string().default('IPv4'),
  endpoints: z.array(z.record(z.any())).default([]),
  ports: z.array(z.record(z.any())).default([]),
  readyCount: z.number().int().default(0),
  totalEndpoints: z.number().int().default(0),
})

export const EndpointSlicesListResponseSchema = z.object({
  items: z.array(EndpointSliceItemSchema),
  count: z.number().int(),
  lastUpdated: z.string().nullable().optional(),
})

export const EventItemSchema = z.object({
  namespace: z.string(),
  name: z.string(),
  reason: z.string(),
  message: z.string(),
  type: z.string(),
  count: z.number().int().default(1),
  firstTimestamp: z.string().nullable().optional(),
  lastTimestamp: z.string().nullable().optional(),
  targetKind: z.string(),
  targetName: z.string(),
  targetNamespace: z.string(),
})

export const EventsListResponseSchema = z.object({
  items: z.array(EventItemSchema),
  count: z.number().int(),
})

export const DetailedHealthResponseSchema = z.object({
  status: z.enum(['healthy', 'degraded', 'unhealthy']),
  agentVersion: z.string(),
  mode: z.string(),
  isMock: z.boolean(),
  kubernetes: z.record(z.any()),
  cache: z.record(z.any()),
  watchers: z.record(z.string()),
  syncErrors: z.record(z.string()),
})

export const MetricsStatusResponseSchema = z.object({
  configured: z.boolean(),
  source: z.string().nullable().optional(),
  message: z.string(),
})
