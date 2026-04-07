import type { QueueAccessScope, QueueReleaseMode } from '@/types/admin'

export type QueueAvailabilityScope = 'All' | 'Enabled only' | 'Disabled only'

export interface QueueDraft {
  name: string
  description: string
  hostedOn: string
  audience: QueueAccessScope
  releaseMode: QueueReleaseMode
  department: string
  enabled: boolean
  printerIds: string[]
  allowedGroups: string[]
}

export function getInitialQueueDraft(): QueueDraft {
  return {
    name: '',
    description: '',
    hostedOn: 'ccm-print-queue-01',
    audience: 'Students',
    releaseMode: 'Secure Release',
    department: 'General Access',
    enabled: true,
    printerIds: [],
    allowedGroups: ['CCM-Students'],
  }
}
