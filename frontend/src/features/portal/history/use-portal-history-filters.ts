import { useDeferredValue, useMemo, useState } from 'react'
import type { PortalJobStatus, PortalPrintJob } from '@/types/portal'

export function usePortalHistoryFilters(jobs: PortalPrintJob[]) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | PortalJobStatus>('All')
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Highest cost'>('Newest')
  const deferredSearch = useDeferredValue(search)

  const filteredJobs = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    const nextJobs = jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [job.fileName, job.id, job.printerName, job.queueName].some((value) => value.toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'All' ? true : job.status === statusFilter
      return matchesSearch && matchesStatus
    })

    if (sortBy === 'Highest cost') {
      return [...nextJobs].sort((a, b) => b.cost - a.cost)
    }

    if (sortBy === 'Oldest') {
      return [...nextJobs].reverse()
    }

    return nextJobs
  }, [deferredSearch, jobs, sortBy, statusFilter])

  return {
    filteredJobs,
    search,
    setSearch,
    sortBy,
    setSortBy,
    statusFilter,
    setStatusFilter,
  }
}
