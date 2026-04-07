import { useDeferredValue, useMemo, useState } from 'react'
import { getQueueDeleteStateLabel, isQueueDeleteBlocked } from '@/lib/status'
import type { AdminQueue } from '@/types/admin'
import type { QueueAvailabilityScope } from '../types'

export function useQueueFilters(queues: AdminQueue[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [audienceFilter, setAudienceFilter] = useState('All audiences')
  const [releaseFilter, setReleaseFilter] = useState('All release modes')
  const [deleteFilter, setDeleteFilter] = useState('All delete states')
  const [availability, setAvailability] = useState<QueueAvailabilityScope>('All')
  const deferredSearch = useDeferredValue(search)

  const filteredQueues = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return queues.filter((queue) => {
      const matchesSearch =
        !query ||
        [queue.name, queue.description, queue.hostedOn, queue.department, ...queue.allowedGroups].some((value) =>
          value.toLowerCase().includes(query),
        )
      const matchesStatus = statusFilter === 'All statuses' ? true : queue.status === statusFilter
      const matchesAudience = audienceFilter === 'All audiences' ? true : queue.audience === audienceFilter
      const matchesRelease = releaseFilter === 'All release modes' ? true : queue.releaseMode === releaseFilter
      const matchesDeleteState = deleteFilter === 'All delete states' ? true : getQueueDeleteStateLabel(queue) === deleteFilter
      const matchesAvailability = availability === 'All' ? true : availability === 'Enabled only' ? queue.enabled : !queue.enabled

      return matchesSearch && matchesStatus && matchesAudience && matchesRelease && matchesDeleteState && matchesAvailability
    })
  }, [audienceFilter, availability, deferredSearch, deleteFilter, queues, releaseFilter, statusFilter])

  const queueMetrics = useMemo(
    () => ({
      total: queues.length,
      blocked: queues.filter(isQueueDeleteBlocked).length,
      secureRelease: queues.filter((queue) => queue.releaseMode === 'Secure Release').length,
      disabled: queues.filter((queue) => !queue.enabled).length,
    }),
    [queues],
  )

  function resetFilters() {
    setStatusFilter('All statuses')
    setAudienceFilter('All audiences')
    setReleaseFilter('All release modes')
    setDeleteFilter('All delete states')
    setAvailability('All')
  }

  return {
    availability,
    filteredQueues,
    queueMetrics,
    resetFilters,
    search,
    setAudienceFilter,
    setAvailability,
    setDeleteFilter,
    setReleaseFilter,
    setSearch,
    setStatusFilter,
    statusFilter,
    audienceFilter,
    releaseFilter,
    deleteFilter,
  }
}
