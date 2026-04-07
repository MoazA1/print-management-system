import { Search } from 'lucide-react'
import { useState } from 'react'
import { FilterBar } from '@/components/composite/filter-bar'
import { formatUsd } from '@/lib/formatters'
import { PortalJobStatusBadge } from '@/features/portal/shared/components'
import { cancelHistoryJob, listHistoryJobs } from './api'
import { usePortalHistoryFilters } from './use-portal-history-filters'
import type { PortalJobStatus } from '@/types/portal'

export function PortalHistoryScreen() {
  const [jobs, setJobs] = useState(() => listHistoryJobs())
  const { filteredJobs, search, setSearch, sortBy, setSortBy, statusFilter, setStatusFilter } =
    usePortalHistoryFilters(jobs)

  function handleCancel(jobId: string) {
    if (cancelHistoryJob(jobId)) {
      setJobs(listHistoryJobs())
    }
  }

  return (
    <div className="min-w-0">
      <section className="ui-panel mb-5 overflow-hidden">
        <div className="border-b border-line bg-mist-50/80 px-5 py-4">
          <div className="text-base font-semibold text-ink-950">Your print history</div>
          <div className="mt-1 text-sm text-slate-500">Only your own records are shown. Each entry includes the metadata required by the SRS.</div>
        </div>
        <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-4">
          <label>
            <div className="ui-heading">Status</div>
            <select className="ui-select mt-2 w-full" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'All' | PortalJobStatus)}>
              <option>All</option>
              <option>Pending Release</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Failed</option>
              <option>Cancelled</option>
            </select>
          </label>
          <label>
            <div className="ui-heading">Sort by</div>
            <select className="ui-select mt-2 w-full" value={sortBy} onChange={(event) => setSortBy(event.target.value as 'Newest' | 'Oldest' | 'Highest cost')}>
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest cost</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <div className="ui-heading">Search</div>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input className="ui-input pl-10" placeholder="Search file name, job ID, queue, or device" value={search} onChange={(event) => setSearch(event.target.value)} />
            </label>
          </div>
        </div>
      </section>

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search your jobs">
        <div className="text-sm text-slate-500">{filteredJobs.length} jobs found</div>
      </FilterBar>

      <div className="mt-4 space-y-4">
        {filteredJobs.length === 0 ? (
          <section className="ui-panel px-5 py-10 text-center text-sm text-slate-500">No print jobs match the current period or filter.</section>
        ) : (
          filteredJobs.map((job) => (
            <section key={job.id} className="ui-panel overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-line bg-mist-50/70 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold text-ink-950">{job.fileName}</div>
                  <div className="mt-1 text-sm text-slate-500">{job.id} · {job.submittedAt} · {job.queueName}</div>
                </div>
                <PortalJobStatusBadge status={job.status} />
              </div>
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
                <div><div className="ui-heading">Device</div><div className="mt-2 text-sm text-ink-950">{job.printerName}</div></div>
                <div><div className="ui-heading">Pages</div><div className="mt-2 text-sm text-ink-950">{job.pages} × {job.copies} = {job.totalPages}</div></div>
                <div><div className="ui-heading">Output</div><div className="mt-2 text-sm text-ink-950">{job.colorMode} · {job.duplex ? 'Duplex' : 'Single-sided'}</div></div>
                <div><div className="ui-heading">Cost</div><div className="mt-2 text-sm text-ink-950">{formatUsd(job.cost)}</div></div>
                <div><div className="ui-heading">Paper</div><div className="mt-2 text-sm text-ink-950">{job.paperType}</div></div>
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-500">{job.retentionDeadline ? `Held files purge at ${job.retentionDeadline}.` : job.details}</div>
                {job.status === 'Pending Release' ? <button type="button" className="ui-button-secondary px-3 py-1.5" onClick={() => handleCancel(job.id)}>Cancel pending job</button> : null}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
