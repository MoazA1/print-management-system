import { cancelPortalJob, getPortalWeeklyUsage, listPortalJobs } from '@/mocks/portal-store'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'

export function getPortalDashboardSnapshot() {
  return {
    jobs: listPortalJobs(),
    profile: getCurrentPortalUserProfile(),
    weeklyUsage: getPortalWeeklyUsage(),
  }
}

export function cancelDashboardJob(jobId: string) {
  return cancelPortalJob(jobId)
}
