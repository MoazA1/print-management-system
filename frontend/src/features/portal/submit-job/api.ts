import {
  createPortalJob,
  getDefaultPortalQueueForCurrentUser,
  listPortalQueuesForCurrentUser,
} from '@/mocks/portal-store'
import { getCurrentPortalUserProfile } from '@/features/portal/session/api'
import type { PortalSubmissionDraft } from '@/types/portal'

const backendBaseUrl = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:4000'

interface DirectPrintResponse {
  jobId: string
  status: 'sent_to_printer'
  printerHost: string
  printerPort: number
  originalFileName: string
  uploadedPath: string
  postScriptPath: string
  bytesSent: number
}

export function getPortalSubmissionSnapshot() {
  return {
    profile: getCurrentPortalUserProfile(),
    queues: listPortalQueuesForCurrentUser(),
    defaultQueue: getDefaultPortalQueueForCurrentUser(),
  }
}

export async function submitPortalJob(draft: PortalSubmissionDraft, file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${backendBaseUrl}/dev/print-direct`, {
    method: 'POST',
    body: formData,
  })

  const payload = await response.json().catch(() => null) as DirectPrintResponse | { error?: string } | null

  if (!response.ok) {
    const message = payload && 'error' in payload && payload.error
      ? payload.error
      : 'Backend rejected the print job.'

    throw new Error(message)
  }

  if (!payload || !('jobId' in payload)) {
    throw new Error('Backend accepted the print job but returned an unexpected response.')
  }

  console.info('Direct print backend result', payload)

  return {
    portalJob: createPortalJob(draft),
    backendResult: payload,
  }
}
