import { adminPrinters, getPrinterById, listAdminQueues } from '@/mocks/admin-store'

export function listPrinters() {
  return adminPrinters
}

export function getPrinterByIdOrUndefined(printerId?: string) {
  return getPrinterById(printerId)
}

export function listPrinterQueueNames() {
  return ['Unassigned', ...new Set(listAdminQueues().map((queue) => queue.name))]
}
