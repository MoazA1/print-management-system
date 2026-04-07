import { createPortalJob, listPortalQueuesForCurrentUser } from '@/mocks/portal-store'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'
import type { PortalSubmissionDraft } from '@/types/portal'

export function getPortalSubmissionSnapshot() {
  return {
    profile: getCurrentPortalUserProfile(),
    queues: listPortalQueuesForCurrentUser(),
  }
}

export function submitPortalJob(draft: PortalSubmissionDraft) {
  return createPortalJob(draft)
}
