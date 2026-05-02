import { api } from '@/lib/api'
import type { AdminQueue } from '@/types/admin'

interface BackendQueueLog {
  id: string
  time: string
  type: string
  state: string
  actor: string
  message: string
}

interface BackendQueue {
  id: string
  name: string
  description: string
  queue_type: string
  status: string
  enabled: boolean
  release_mode: string
  retention_hours: number
  cost_per_page: number
  printer_count: number
  printer_ids?: string[]
  allowed_groups?: string[]
  pending_jobs: number
  held_jobs: number
  released_today: number
  last_activity_at?: string
  queue_logs?: BackendQueueLog[]
}

interface PaginatedQueues {
  data: BackendQueue[]
}

interface ApiData<T> {
  data: T
}

export interface ListQueuesInput {
  search?: string
  status?: AdminQueue['status'] | 'All statuses'
  limit?: number
}

export interface QueueMutationInput {
  name: string
  description: string
  status: AdminQueue['status']
  releaseMode: AdminQueue['releaseMode']
  audience: AdminQueue['audience']
  retentionHours: number
  costPerPage: number
  printerIds: string[]
  allowedGroups: string[]
}

export async function listQueues(input: ListQueuesInput = {}) {
  const params = new URLSearchParams()
  const search = input.search?.trim()

  params.set('limit', String(input.limit ?? 100))

  if (search) {
    params.set('search', search)
  }

  if (input.status && input.status !== 'All statuses') {
    params.set('status', mapStatusToBackend(input.status))
  }

  const response = await api.get<PaginatedQueues>(`/queues?${params.toString()}`)
  return response.data.map(mapQueue)
}

export async function getQueueByIdOrUndefined(queueId?: string) {
  if (!queueId) return undefined

  try {
    const response = await api.get<ApiData<BackendQueue>>(`/queues/${queueId}`)
    return mapQueue(response.data)
  } catch {
    return undefined
  }
}

export async function createQueue(input: QueueMutationInput) {
  const response = await api.post<ApiData<BackendQueue>>('/queues', toBackendInput(input))
  return mapQueue(response.data)
}

export async function saveQueue(queueId: string, input: QueueMutationInput) {
  const response = await api.patch<ApiData<BackendQueue>>(`/queues/${queueId}`, toBackendInput(input))
  return mapQueue(response.data)
}

export async function removeQueue(queueId: string) {
  await api.delete<void>(`/queues/${queueId}`)
}

function toBackendInput(input: QueueMutationInput) {
  return {
    name: input.name.trim(),
    description: input.description.trim(),
    status: mapStatusToBackend(input.status),
    queueType: mapAudienceToBackend(input.audience),
    releaseMode: mapReleaseModeToBackend(input.releaseMode),
    retentionHours: input.retentionHours,
    costPerPage: Math.max(0, Number(input.costPerPage || 0)),
    printerIds: input.printerIds,
    allowedGroups: input.allowedGroups,
  }
}

function mapQueue(queue: BackendQueue): AdminQueue {
  return {
    id: queue.id,
    name: queue.name,
    description: queue.description,
    hostedOn: 'Database managed',
    status: mapStatus(queue.status),
    enabled: queue.status === 'active',
    releaseMode: mapReleaseMode(queue.release_mode),
    audience: mapAudience(queue.queue_type),
    department: '',
    allowedGroups: queue.allowed_groups ?? [],
    colorMode: 'Black & White',
    defaultDuplex: true,
    costPerPage: queue.cost_per_page,
    printerIds: queue.printer_ids ?? [],
    pendingJobs: queue.pending_jobs,
    heldJobs: queue.held_jobs,
    releasedToday: queue.released_today,
    lastActivity: formatActivity(queue.last_activity_at),
    autoDeleteAfterHours: queue.retention_hours,
    failureMode: 'Hold until redirected',
    notes: queue.description,
    queueLogs: (queue.queue_logs ?? []).map((entry) => ({
      id: entry.id,
      time: formatActivity(entry.time),
      type: mapLogType(entry.type),
      state: mapLogState(entry.state),
      actor: entry.actor,
      message: entry.message,
    })),
  }
}

function mapStatus(status: string): AdminQueue['status'] {
  return status === 'active' ? 'Online' : 'Offline'
}

function mapStatusToBackend(status: AdminQueue['status']) {
  return status === 'Online' ? 'active' : 'disabled'
}

function mapReleaseMode(releaseMode: string): AdminQueue['releaseMode'] {
  return releaseMode === 'immediate' ? 'Immediate' : 'Secure Release'
}

function mapReleaseModeToBackend(releaseMode: AdminQueue['releaseMode']) {
  return releaseMode === 'Immediate' ? 'immediate' : 'secure_release'
}

function mapAudience(queueType: string): AdminQueue['audience'] {
  if (queueType === 'student') return 'Students'
  if (queueType === 'faculty') return 'Faculty'
  if (queueType === 'staff') return 'Staff'
  return 'Mixed'
}

function mapAudienceToBackend(audience: AdminQueue['audience']) {
  if (audience === 'Students') return 'student'
  if (audience === 'Faculty') return 'faculty'
  if (audience === 'Staff') return 'staff'
  return 'mixed'
}

function mapLogType(type: string): AdminQueue['queueLogs'][number]['type'] {
  if (type === 'Error') return 'Error'
  if (type === 'Policy' || type === 'Queue') return 'Policy'
  if (type === 'Routing') return 'Routing'
  return 'Release'
}

function mapLogState(state: string): AdminQueue['queueLogs'][number]['state'] {
  if (state === 'Open') return 'Open'
  if (state === 'Resolved') return 'Resolved'
  return 'Info'
}

function formatActivity(value?: string) {
  if (!value) return 'No activity yet'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  const today = new Date()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const sameDay =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  if (sameDay) {
    return `Today ${hours}:${minutes}`
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${date.getDate()} ${hours}:${minutes}`
}
