import { useDeferredValue, useMemo, useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  FileClock,
  Search,
  Upload,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import {
  cancelPortalJob,
  createPortalJob,
  getPortalWeeklyUsage,
  listPortalJobs,
  listPortalQueuesForCurrentUser,
  portalUserProfile,
} from '../data/portal-data'
import type { PortalJobStatus, PortalPrintJob, PortalQueueOption, PortalSubmissionDraft } from '../types/portal'

const usageLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`
}

function statusClass(status: PortalJobStatus) {
  if (status === 'Completed') return 'bg-accent-100 text-accent-700'
  if (status === 'Failed' || status === 'Cancelled') return 'bg-danger-100 text-danger-500'
  return 'bg-warn-100 text-warn-500'
}

function tinyLinePath(values: number[]) {
  const width = 440
  const height = 120
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = Math.max(max - min, 1)

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(' ')
}

function PortalMetric({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <section className="ui-panel overflow-hidden">
      <div className="h-1 w-full bg-sky-600" />
      <div className="px-4 py-4">
        <div className="ui-heading">{label}</div>
        <div className="mt-3 text-3xl font-semibold tracking-tight text-ink-950">{value}</div>
        <div className="mt-1 text-sm text-slate-500">{hint}</div>
      </div>
    </section>
  )
}

function JobStatusBadge({ status }: { status: PortalJobStatus }) {
  return <span className={`inline-flex px-2.5 py-1 text-[0.72rem] font-semibold ${statusClass(status)}`}>{status}</span>
}

function QueueCard({ queue, selected, onSelect }: { queue: PortalQueueOption; selected?: boolean; onSelect?: () => void }) {
  return (
    <button
      type="button"
      onClick={queue.available ? onSelect : undefined}
      className={`w-full border px-4 py-4 text-left transition ${
        selected
          ? 'border-ink-950 bg-ink-950 text-white'
          : queue.available
            ? 'border-line bg-white hover:border-slate-300 hover:bg-mist-50'
            : 'border-line bg-slate-100/60 text-slate-500'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{queue.name}</div>
          <div className={`mt-1 text-sm ${selected ? 'text-white/75' : 'text-slate-500'}`}>
            {queue.printerName} · {queue.location}
          </div>
        </div>
        <span
          className={`px-2 py-1 text-[0.7rem] font-semibold ${
            queue.available
              ? selected
                ? 'bg-white/15 text-white'
                : 'bg-accent-100 text-accent-700'
              : 'bg-white text-slate-500'
          }`}
        >
          {queue.access}
        </span>
      </div>
      <div className={`mt-3 flex flex-wrap gap-3 text-sm ${selected ? 'text-white/75' : 'text-slate-500'}`}>
        <span>{queue.releaseMode}</span>
        <span>{queue.pendingJobs} jobs queued</span>
        <span>{queue.colorMode}</span>
      </div>
      {!queue.available && queue.reason ? (
        <div className="mt-3 text-sm font-medium text-danger-500">{queue.reason}</div>
      ) : null}
    </button>
  )
}

function DashboardActiveJob({
  job,
  onCancel,
}: {
  job: PortalPrintJob
  onCancel: (jobId: string) => void
}) {
  return (
    <div className="border-b border-line py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-ink-950">{job.fileName}</div>
          <div className="mt-1 text-sm text-slate-500">
            {job.id} · {job.totalPages} pages · {formatCurrency(job.cost)}
          </div>
        </div>
        <JobStatusBadge status={job.status} />
      </div>
      <div className="mt-2 text-sm text-slate-500">{job.details}</div>
      {job.retentionDeadline ? (
        <div className="mt-2 text-sm text-slate-500">Auto-purge deadline: {job.retentionDeadline}</div>
      ) : null}
      {job.status === 'Pending Release' ? (
        <div className="mt-3">
          <button type="button" className="ui-button-secondary px-3 py-1.5" onClick={() => onCancel(job.id)}>
            Cancel pending job
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function PortalDashboardPage() {
  const [jobs, setJobs] = useState(() => listPortalJobs())
  const weeklyUsage = getPortalWeeklyUsage()
  const activeJobs = jobs.filter((job) => job.status === 'Pending Release' || job.status === 'In Progress')
  const completedJobs = jobs.filter((job) => job.status === 'Completed')
  const totalCost = completedJobs.reduce((sum, job) => sum + job.cost, 0)
  const totalPages = completedJobs.reduce((sum, job) => sum + job.totalPages, 0)
  const quotaRemaining = portalUserProfile.quotaTotal - portalUserProfile.quotaUsed

  function handleCancel(jobId: string) {
    if (cancelPortalJob(jobId)) {
      setJobs(listPortalJobs())
    }
  }

  return (
    <div className="min-w-0">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortalMetric label="Completed pages" value={`${totalPages}`} hint="Completed jobs only" />
        <PortalMetric label="Completed cost" value={formatCurrency(totalCost)} hint="Calculated from job records" />
        <PortalMetric
          label="Quota used"
          value={`${Math.round((portalUserProfile.quotaUsed / portalUserProfile.quotaTotal) * 100)}%`}
          hint={`${portalUserProfile.quotaUsed} of ${portalUserProfile.quotaTotal} pages`}
        />
        <PortalMetric label="Active jobs" value={`${activeJobs.length}`} hint="Pending release or in progress" />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">This week</div>
            <div className="mt-1 text-sm text-slate-500">Personal print activity from your job records.</div>
          </div>
          <div className="px-5 py-5">
            <div className="rounded-none border border-line bg-white p-4">
              <svg viewBox="0 0 440 140" className="h-44 w-full">
                {[0, 1, 2, 3].map((row) => (
                  <line key={row} x1="0" x2="440" y1={20 + row * 30} y2={20 + row * 30} stroke="#e7edf3" />
                ))}
                <polyline
                  fill="none"
                  points={tinyLinePath(weeklyUsage)}
                  transform="translate(0 10)"
                  stroke="#0f7a4b"
                  strokeWidth="3"
                />
                {tinyLinePath(weeklyUsage)
                  .split(' ')
                  .map((point, index) => {
                    const [x, y] = point.split(',').map(Number)
                    return <circle key={`${point}-${index}`} cx={x} cy={y + 10} r="3.5" fill="#0f7a4b" />
                  })}
              </svg>
              <div className="mt-3 grid grid-cols-7 text-center font-mono text-[0.68rem] uppercase tracking-[0.16em] text-slate-500">
                {usageLabels.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Quota progress</div>
            <div className="mt-1 text-sm text-slate-500">Submission is blocked once your remaining quota is insufficient.</div>
          </div>
          <div className="px-5 py-5">
            <div className="text-3xl font-semibold tracking-tight text-ink-950">
              {portalUserProfile.quotaUsed}/{portalUserProfile.quotaTotal}
            </div>
            <div className="mt-4 h-3 bg-slate-100">
              <div
                className="h-full bg-sky-600"
                style={{ width: `${(portalUserProfile.quotaUsed / portalUserProfile.quotaTotal) * 100}%` }}
              />
            </div>
            <div className="mt-3 text-sm text-slate-500">{quotaRemaining} pages remaining this period.</div>
            <div className="mt-4 border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">
              Pending or unreleased files are purged after {portalUserProfile.retentionHours} hours.
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="ui-panel overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line bg-mist-50/80 px-5 py-4">
            <div>
              <div className="text-base font-semibold text-ink-950">Recent jobs</div>
              <div className="mt-1 text-sm text-slate-500">Your most recent submissions and final statuses.</div>
            </div>
            <Link className="ui-button-secondary px-3 py-1.5" to="/portal/history">
              <FileClock className="size-4" />
              Full history
            </Link>
          </div>
          <div className="px-5 py-4">
            <DataTable<PortalPrintJob>
              columns={[
                {
                  key: 'file',
                  header: 'Document',
                  render: (job) => (
                    <div>
                      <div className="font-semibold text-ink-950">{job.fileName}</div>
                      <div className="mt-1 text-sm text-slate-500">{job.id}</div>
                    </div>
                  ),
                },
                {
                  key: 'device',
                  header: 'Queue/device',
                  render: (job) => <span className="text-sm text-slate-600">{job.queueName} · {job.printerName}</span>,
                },
                {
                  key: 'pages',
                  header: 'Pages',
                  render: (job) => <span className="text-sm text-slate-600">{job.totalPages}</span>,
                },
                {
                  key: 'cost',
                  header: 'Cost',
                  render: (job) => <span className="text-sm text-slate-600">{formatCurrency(job.cost)}</span>,
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (job) => <JobStatusBadge status={job.status} />,
                },
              ]}
              rows={jobs.slice(0, 5)}
              getRowKey={(job) => job.id}
              emptyLabel="You have no print jobs yet."
            />
          </div>
        </section>

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Active job actions</div>
            <div className="mt-1 text-sm text-slate-500">Cancel pending jobs before release or watch jobs already in progress.</div>
          </div>
          <div className="px-5 py-3">
            {activeJobs.length === 0 ? (
              <div className="py-8 text-sm text-slate-500">No active jobs right now.</div>
            ) : (
              activeJobs.map((job) => (
                <DashboardActiveJob key={job.id} job={job} onCancel={handleCancel} />
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export function PortalSubmitJobPage() {
  const navigate = useNavigate()
  const [file, setFile] = useState<File | null>(null)
  const [draft, setDraft] = useState<PortalSubmissionDraft>({
    fileName: '',
    queueId: '',
    pages: 10,
    copies: 1,
    colorMode: 'Black & White',
    paperType: 'Standard',
    duplex: true,
  })
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error'; message: string } | null>(null)
  const queues = listPortalQueuesForCurrentUser()
  const selectedQueue = queues.find((queue) => queue.id === draft.queueId)
  const quotaRemaining = portalUserProfile.quotaTotal - portalUserProfile.quotaUsed
  const totalPages = draft.pages * draft.copies
  const estCost = selectedQueue
    ? Number(
        (
          totalPages *
          selectedQueue.costPerPage *
          (draft.duplex ? 0.9 : 1) *
          (draft.colorMode === 'Color' ? 2 : 1)
        ).toFixed(2),
      )
    : 0

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null
    setFile(nextFile)
    setDraft((current) => ({ ...current, fileName: nextFile?.name ?? '' }))
    setFeedback(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!file) {
      setFeedback({ tone: 'error', message: 'Choose a file before submitting.' })
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
    const allowedExtensions = ['pdf', 'docx', 'pptx']

    if (!allowedExtensions.includes(extension) || file.size > 20 * 1024 * 1024) {
      setFeedback({ tone: 'error', message: 'Use a PDF, DOCX, or PPTX file under 20 MB.' })
      return
    }

    if (!selectedQueue || !selectedQueue.available) {
      setFeedback({ tone: 'error', message: 'Select an available queue before submitting.' })
      return
    }

    if (totalPages > quotaRemaining) {
      setFeedback({ tone: 'error', message: 'This job exceeds your remaining quota.' })
      return
    }

    const createdJob = createPortalJob({
      ...draft,
      fileName: file.name,
    })

    if (!createdJob) {
      setFeedback({ tone: 'error', message: 'The selected queue is not currently available.' })
      return
    }

    setFeedback({
      tone: 'success',
      message: `Job accepted as ${createdJob.id}. It will remain held for up to ${portalUserProfile.retentionHours} hours if unreleased.`,
    })
    setFile(null)
    setDraft({
      fileName: '',
      queueId: '',
      pages: 10,
      copies: 1,
      colorMode: 'Black & White',
      paperType: 'Standard',
      duplex: true,
    })
  }

  return (
    <div className="min-w-0">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">Submit a print job</div>
              <div className="mt-1 text-sm text-slate-500">Choose a supported file, an available queue, and the print settings that affect quota and cost.</div>
            </div>
            <div className="grid gap-6 px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">File</div>
              </div>
              <div className="space-y-3">
                <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-line bg-mist-50 px-4 py-6 text-center">
                  <Upload className="size-5 text-slate-500" />
                  <div className="mt-3 text-sm font-semibold text-ink-950">
                    {file ? file.name : 'Upload PDF, DOCX, or PPTX'}
                  </div>
                  <div className="mt-1 text-sm text-slate-500">Maximum file size: 20 MB</div>
                  <input type="file" className="sr-only" accept=".pdf,.docx,.pptx" onChange={handleFileChange} />
                </label>
              </div>
            </div>

            <div className="grid gap-6 border-t border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Queue selection</div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="ui-heading">Queues available to you</div>
                  <div className="mt-3 grid gap-3 lg:grid-cols-2">
                    {queues.map((queue) => (
                      <QueueCard
                        key={queue.id}
                        queue={queue}
                        selected={draft.queueId === queue.id}
                        onSelect={() => {
                          setDraft((current) => ({ ...current, queueId: queue.id }))
                          setFeedback(null)
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 border-t border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Print options</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label>
                  <div className="ui-heading">Pages</div>
                  <input
                    type="number"
                    min="1"
                    className="ui-input mt-2"
                    value={draft.pages}
                    onChange={(event) => setDraft((current) => ({ ...current, pages: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  <div className="ui-heading">Copies</div>
                  <input
                    type="number"
                    min="1"
                    className="ui-input mt-2"
                    value={draft.copies}
                    onChange={(event) => setDraft((current) => ({ ...current, copies: Number(event.target.value) }))}
                  />
                </label>
                <label>
                  <div className="ui-heading">Color mode</div>
                  <select
                    className="ui-select mt-2 w-full"
                    value={draft.colorMode}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        colorMode: event.target.value as PortalSubmissionDraft['colorMode'],
                      }))
                    }
                  >
                    <option>Black & White</option>
                    <option>Color</option>
                  </select>
                </label>
                <label>
                  <div className="ui-heading">Paper type</div>
                  <select
                    className="ui-select mt-2 w-full"
                    value={draft.paperType}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        paperType: event.target.value as PortalSubmissionDraft['paperType'],
                      }))
                    }
                  >
                    <option>Standard</option>
                    <option>Heavy</option>
                    <option>Glossy</option>
                  </select>
                </label>
                <label className="flex items-center gap-3 lg:col-span-2">
                  <input
                    type="checkbox"
                    checked={draft.duplex}
                    onChange={(event) => setDraft((current) => ({ ...current, duplex: event.target.checked }))}
                  />
                  <span className="text-sm text-ink-950">Double-sided printing when supported</span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-3 border-t border-line px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              {feedback ? (
                <div
                  className={`flex items-start gap-2 text-sm ${
                    feedback.tone === 'success' ? 'text-accent-700' : 'text-danger-500'
                  }`}
                >
                  {feedback.tone === 'success' ? <CheckCircle2 className="mt-0.5 size-4" /> : <AlertTriangle className="mt-0.5 size-4" />}
                  <span>{feedback.message}</span>
                </div>
              ) : (
                <div className="text-sm text-slate-500">Accepted jobs receive a unique job ID and are traceable in your history.</div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className="ui-button-secondary" onClick={() => navigate('/portal/history')}>
                  View history
                </button>
                <button type="submit" className="ui-button">
                  Submit job
                </button>
              </div>
            </div>
          </section>
        </form>

        <aside className="space-y-5">
          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">Submission summary</div>
            </div>
            <div className="space-y-4 px-5 py-5 text-sm text-slate-600">
              <div className="flex justify-between gap-4">
                <span>Selected queue</span>
                <span className="font-medium text-ink-950">{selectedQueue?.name ?? 'None'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Total pages</span>
                <span className="font-medium text-ink-950">{totalPages}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Estimated cost</span>
                <span className="font-medium text-ink-950">{formatCurrency(estCost)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Release</span>
                <span className="font-medium text-ink-950">{selectedQueue?.releaseMode ?? 'Select a queue'}</span>
              </div>
              <div className="border-t border-line pt-4 text-slate-500">
                Unreleased files are removed automatically after {portalUserProfile.retentionHours} hours.
              </div>
            </div>
          </section>

          <section className="ui-panel overflow-hidden">
            <div className="border-b border-line bg-mist-50/80 px-5 py-4">
              <div className="text-base font-semibold text-ink-950">Quota</div>
            </div>
            <div className="px-5 py-5">
              <div className="text-2xl font-semibold tracking-tight text-ink-950">{portalUserProfile.quotaUsed}/{portalUserProfile.quotaTotal}</div>
              <div className="mt-4 h-3 bg-slate-100">
                <div
                  className="h-full bg-sky-600"
                  style={{ width: `${(portalUserProfile.quotaUsed / portalUserProfile.quotaTotal) * 100}%` }}
                />
              </div>
              <div className="mt-3 text-sm text-slate-500">
                {portalUserProfile.quotaTotal - portalUserProfile.quotaUsed} pages currently available.
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export function PortalHistoryPage() {
  const [jobs, setJobs] = useState(() => listPortalJobs())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | PortalJobStatus>('All')
  const [sortBy, setSortBy] = useState<'Newest' | 'Oldest' | 'Highest cost'>('Newest')
  const deferredSearch = useDeferredValue(search)

  const filteredJobs = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()
    const nextJobs = jobs.filter((job) => {
      const matchesSearch =
        !query ||
        [job.fileName, job.id, job.printerName, job.queueName].some((value) =>
          value.toLowerCase().includes(query),
        )
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

  function handleCancel(jobId: string) {
    if (cancelPortalJob(jobId)) {
      setJobs(listPortalJobs())
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
            <select
              className="ui-select mt-2 w-full"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as 'All' | PortalJobStatus)}
            >
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
            <select
              className="ui-select mt-2 w-full"
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value as 'Newest' | 'Oldest' | 'Highest cost')}
            >
              <option>Newest</option>
              <option>Oldest</option>
              <option>Highest cost</option>
            </select>
          </label>
          <div className="md:col-span-2">
            <div className="ui-heading">Search</div>
            <label className="relative mt-2 block">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                className="ui-input pl-10"
                placeholder="Search file name, job ID, queue, or device"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search your jobs"
      >
        <div className="text-sm text-slate-500">{filteredJobs.length} jobs found</div>
      </FilterBar>

      <div className="mt-4 space-y-4">
        {filteredJobs.length === 0 ? (
          <section className="ui-panel px-5 py-10 text-center text-sm text-slate-500">
            No print jobs match the current period or filter.
          </section>
        ) : (
          filteredJobs.map((job) => (
            <section key={job.id} className="ui-panel overflow-hidden">
              <div className="flex flex-col gap-4 border-b border-line bg-mist-50/70 px-5 py-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-semibold text-ink-950">{job.fileName}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {job.id} · {job.submittedAt} · {job.queueName}
                  </div>
                </div>
                <JobStatusBadge status={job.status} />
              </div>
              <div className="grid gap-4 px-5 py-5 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <div className="ui-heading">Device</div>
                  <div className="mt-2 text-sm text-ink-950">{job.printerName}</div>
                </div>
                <div>
                  <div className="ui-heading">Pages</div>
                  <div className="mt-2 text-sm text-ink-950">{job.pages} × {job.copies} = {job.totalPages}</div>
                </div>
                <div>
                  <div className="ui-heading">Output</div>
                  <div className="mt-2 text-sm text-ink-950">{job.colorMode} · {job.duplex ? 'Duplex' : 'Single-sided'}</div>
                </div>
                <div>
                  <div className="ui-heading">Cost</div>
                  <div className="mt-2 text-sm text-ink-950">{formatCurrency(job.cost)}</div>
                </div>
                <div>
                  <div className="ui-heading">Paper</div>
                  <div className="mt-2 text-sm text-ink-950">{job.paperType}</div>
                </div>
              </div>
              <div className="flex flex-col gap-3 border-t border-line px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div className="text-sm text-slate-500">
                  {job.retentionDeadline
                    ? `Held files purge at ${job.retentionDeadline}.`
                    : job.details}
                </div>
                {job.status === 'Pending Release' ? (
                  <button type="button" className="ui-button-secondary px-3 py-1.5" onClick={() => handleCancel(job.id)}>
                    Cancel pending job
                  </button>
                ) : null}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  )
}
