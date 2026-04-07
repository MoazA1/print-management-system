import {
  adminGroups,
  adminPrinters,
  createAdminQueue,
  deleteAdminQueue,
  getQueueById,
  listAdminQueues,
  updateAdminQueue,
} from '@/mocks/admin-store'
import type { AdminQueue } from '@/types/admin'

export function listQueues() {
  return listAdminQueues()
}

export function getQueueByIdOrUndefined(queueId?: string) {
  return getQueueById(queueId)
}

export function listQueuePrinters() {
  return adminPrinters
}

export function listQueueGroups() {
  return adminGroups
}

export function createQueue(queue: AdminQueue) {
  return createAdminQueue(queue)
}

export function saveQueue(queue: AdminQueue) {
  return updateAdminQueue(queue)
}

export function removeQueue(queueId: string) {
  return deleteAdminQueue(queueId)
}
