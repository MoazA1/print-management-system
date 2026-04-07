import { Badge } from '@/components/ui/badge'
import { getQueueLogStateClass } from '@/lib/status'
import type { QueueLogEntry } from '@/types/admin'

export function QueueLogStateBadge({ state }: { state: QueueLogEntry['state'] }) {
  return <Badge className={getQueueLogStateClass(state)}>{state}</Badge>
}
