import { cancelPortalJob, listPortalJobs } from '@/mocks/portal-store'

export function listHistoryJobs() {
  return listPortalJobs()
}

export function cancelHistoryJob(jobId: string) {
  return cancelPortalJob(jobId)
}
