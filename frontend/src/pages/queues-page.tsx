import { useDeferredValue, useMemo, useState } from 'react'
import {
  AlertTriangle,
  ArrowRightLeft,
  Check,
  FileClock,
  Plus,
  Power,
  Printer,
  RotateCcw,
  Save,
  ShieldAlert,
  Trash2,
} from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '../components/ui/action-rail'
import { AdvancedFilterPanel } from '../components/ui/advanced-filter-panel'
import { DataTable } from '../components/ui/data-table'
import { FilterBar } from '../components/ui/filter-bar'
import { PageHeader } from '../components/ui/page-header'
import { SectionTabs } from '../components/ui/section-tabs'
import { StatStrip } from '../components/ui/stat-strip'
import { StatusBadge } from '../components/ui/status-badge'
import {
  adminGroups,
  adminPrinters,
  createAdminQueue,
  deleteAdminQueue,
  getQueueById,
  listAdminQueues,
  updateAdminQueue,
} from '../data/admin-data'
import type { AdminQueue, QueueAccessScope, QueueReleaseMode, QueueLogEntry } from '../types/admin'

type QueueAvailabilityScope = 'All' | 'Enabled only' | 'Disabled only'

interface NewQueueDraft {
  name: string
  description: string
  hostedOn: string
  audience: QueueAccessScope
  releaseMode: QueueReleaseMode
  department: string
  enabled: boolean
  printerIds: string[]
  allowedGroups: string[]
}

function getInitialDraft(): NewQueueDraft {
  return {
    name: '',
    description: '',
    hostedOn: 'ccm-print-queue-01',
    audience: 'Students',
    releaseMode: 'Secure Release',
    department: 'General Access',
    enabled: true,
    printerIds: [],
    allowedGroups: ['CCM-Students'],
  }
}

function isDeleteBlocked(queue: Pick<AdminQueue, 'pendingJobs' | 'heldJobs'>) {
  return queue.pendingJobs > 0 || queue.heldJobs > 0
}

function getDeleteStateLabel(queue: Pick<AdminQueue, 'pendingJobs' | 'heldJobs'>) {
  return isDeleteBlocked(queue) ? 'Blocked by active jobs' : 'Ready to delete'
}

function formatCurrency(value: number) {
  return `SAR ${value.toFixed(2)}`
}

function QueueLogStateBadge({ state }: { state: QueueLogEntry['state'] }) {
  const className =
    state === 'Resolved'
      ? 'bg-accent-100 text-accent-700'
      : state === 'Open'
        ? 'bg-danger-100 text-danger-500'
        : 'bg-mist-50 text-slate-600'

  return <span className={`inline-flex px-2.5 py-1 text-[0.72rem] font-semibold ${className}`}>{state}</span>
}

export function QueuesPage() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState(() => listAdminQueues())
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All statuses')
  const [audienceFilter, setAudienceFilter] = useState('All audiences')
  const [releaseFilter, setReleaseFilter] = useState('All release modes')
  const [deleteFilter, setDeleteFilter] = useState('All delete states')
  const [availability, setAvailability] = useState<QueueAvailabilityScope>('All')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState<NewQueueDraft>(() => getInitialDraft())
  const deferredSearch = useDeferredValue(search)

  const filteredQueues = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase()

    return queues.filter((queue) => {
      const matchesSearch =
        !query ||
        [
          queue.name,
          queue.description,
          queue.hostedOn,
          queue.department,
          ...queue.allowedGroups,
        ].some((value) => value.toLowerCase().includes(query))
      const matchesStatus = statusFilter === 'All statuses' ? true : queue.status === statusFilter
      const matchesAudience = audienceFilter === 'All audiences' ? true : queue.audience === audienceFilter
      const matchesRelease =
        releaseFilter === 'All release modes' ? true : queue.releaseMode === releaseFilter
      const matchesDeleteState =
        deleteFilter === 'All delete states'
          ? true
          : deleteFilter === 'Blocked by active jobs'
            ? isDeleteBlocked(queue)
            : !isDeleteBlocked(queue)
      const matchesAvailability =
        availability === 'All'
          ? true
          : availability === 'Enabled only'
            ? queue.enabled
            : !queue.enabled

      return (
        matchesSearch &&
        matchesStatus &&
        matchesAudience &&
        matchesRelease &&
        matchesDeleteState &&
        matchesAvailability
      )
    })
  }, [
    audienceFilter,
    availability,
    deferredSearch,
    deleteFilter,
    queues,
    releaseFilter,
    statusFilter,
  ])

  const queueMetrics = useMemo(
    () => ({
      total: queues.length,
      blocked: queues.filter(isDeleteBlocked).length,
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

  function toggleDraftSelection(field: 'printerIds' | 'allowedGroups', value: string) {
    setDraft((current) => {
      const nextValues = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]

      return { ...current, [field]: nextValues }
    })
  }

  function handleCreateQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = draft.name.trim()
    const newQueueId = `que-${Date.now().toString(36)}`
    const newQueue: AdminQueue = {
      id: newQueueId,
      name: trimmedName || 'New queue',
      description: draft.description.trim() || 'New queue draft awaiting policy review.',
      hostedOn: draft.hostedOn,
      status: draft.enabled ? 'Online' : 'Offline',
      enabled: draft.enabled,
      releaseMode: draft.releaseMode,
      audience: draft.audience,
      department: draft.department.trim() || 'General Access',
      allowedGroups: draft.allowedGroups,
      colorMode: 'Black & White',
      defaultDuplex: true,
      costPerPage: 0.05,
      printerIds: draft.printerIds,
      pendingJobs: 0,
      heldJobs: 0,
      releasedToday: 0,
      lastActivity: 'Not released yet',
      autoDeleteAfterHours: 24,
      failureMode: 'Hold until redirected',
      notes: 'Created from the queue administration screen. Review access groups and printer assignments before production use.',
      queueLogs: [
        {
          id: `${newQueueId}-log-01`,
          time: '2026-04-06 10:00',
          type: 'Policy',
          state: 'Info',
          actor: 'david.admin',
          message: 'Queue created from the admin console draft flow.',
        },
      ],
    }

    createAdminQueue(newQueue)
    setQueues(listAdminQueues())
    setDraft(getInitialDraft())
    setCreateOpen(false)
    navigate(`/admin/queues/${newQueue.id}`)
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title="Queue management"
        description="Dedicated queue CRUD, assignment, hold/release policy, and deletion-safety surface for the admin console."
        meta={
          <button type="button" className="ui-button" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New queue
          </button>
        }
      />

      <StatStrip
        items={[
          { label: 'Total queues', value: `${queueMetrics.total}`, hint: 'Dedicated admin queue records' },
          { label: 'Delete blocked', value: `${queueMetrics.blocked}`, hint: 'Queues with active or held jobs' },
          { label: 'Secure release', value: `${queueMetrics.secureRelease}`, hint: 'Release requires operator action' },
          { label: 'Disabled', value: `${queueMetrics.disabled}`, hint: 'Queues currently unavailable' },
        ]}
      />

      <ActionRail
        title="Queue controls"
        items={[
          {
            label: 'Create queue draft',
            hint: 'Define routing, release mode, and audience scope.',
            icon: Plus,
            onClick: () => setCreateOpen(true),
          },
          {
            label: 'Review printer assignment',
            hint: 'Check which queues can release on each device.',
            icon: Printer,
          },
          {
            label: 'Toggle queue availability',
            hint: 'Enable or disable queues without deleting the record.',
            icon: Power,
          },
          {
            label: 'Delete queue',
            hint: 'Blocked whenever active or held jobs remain.',
            icon: Trash2,
            tone: 'danger',
          },
        ]}
      />

      {isCreateOpen ? (
        <section className="ui-panel mb-5 overflow-hidden">
          <div className="border-b border-line bg-accent-100/35 px-5 py-4">
            <div className="ui-kicker text-accent-700">New queue draft</div>
            <div className="mt-1 text-base font-semibold text-ink-950">Create a first-class queue record</div>
          </div>

          <form onSubmit={handleCreateQueue}>
            <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Queue identity</div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <label>
                  <div className="ui-heading">Queue name</div>
                  <input
                    className="ui-input mt-2"
                    value={draft.name}
                    onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                    placeholder="Student Duplex Queue"
                  />
                </label>
                <label>
                  <div className="ui-heading">Hosted on</div>
                  <input
                    className="ui-input mt-2"
                    value={draft.hostedOn}
                    onChange={(event) => setDraft((current) => ({ ...current, hostedOn: event.target.value }))}
                  />
                </label>
                <label>
                  <div className="ui-heading">Audience</div>
                  <select
                    className="ui-select mt-2 w-full"
                    value={draft.audience}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        audience: event.target.value as QueueAccessScope,
                      }))
                    }
                  >
                    <option>Students</option>
                    <option>Staff</option>
                    <option>Faculty</option>
                    <option>Mixed</option>
                  </select>
                </label>
                <label>
                  <div className="ui-heading">Release mode</div>
                  <select
                    className="ui-select mt-2 w-full"
                    value={draft.releaseMode}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        releaseMode: event.target.value as QueueReleaseMode,
                      }))
                    }
                  >
                    <option>Secure Release</option>
                    <option>Immediate</option>
                    <option>Kiosk Release</option>
                  </select>
                </label>
                <label>
                  <div className="ui-heading">Department</div>
                  <input
                    className="ui-input mt-2"
                    value={draft.department}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, department: event.target.value }))
                    }
                  />
                </label>
                <label className="flex items-center gap-3 pt-7">
                  <input
                    type="checkbox"
                    checked={draft.enabled}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, enabled: event.target.checked }))
                    }
                  />
                  <span className="text-sm text-ink-950">Queue enabled on creation</span>
                </label>
                <label className="lg:col-span-2">
                  <div className="ui-heading">Description</div>
                  <textarea
                    className="ui-textarea mt-2"
                    value={draft.description}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, description: event.target.value }))
                    }
                    placeholder="Describe queue purpose, restriction scope, and routing assumptions."
                  />
                </label>
              </div>
            </div>

            <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div>
                <div className="text-sm font-medium text-ink-950">Assignments and access</div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <div>
                  <div className="ui-heading">Assigned printers</div>
                  <div className="mt-2 text-sm text-slate-500">
                    Each printer belongs to one queue at a time. Selecting it here reassigns it from any existing queue.
                  </div>
                  <div className="mt-3 grid gap-2">
                    {adminPrinters.map((printer) => (
                      <label
                        key={printer.id}
                        className="flex items-start gap-3 border border-line bg-mist-50 px-3 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={draft.printerIds.includes(printer.id)}
                          onChange={() => toggleDraftSelection('printerIds', printer.id)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-950">{printer.name}</span>
                          <span className="mt-1 block text-sm text-slate-500">
                            {printer.location} · {printer.status}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="ui-heading">Allowed groups</div>
                  <div className="mt-3 grid gap-2">
                    {adminGroups.map((group) => (
                      <label
                        key={group.id}
                        className="flex items-start gap-3 border border-line bg-white px-3 py-3"
                      >
                        <input
                          type="checkbox"
                          checked={draft.allowedGroups.includes(group.name)}
                          onChange={() => toggleDraftSelection('allowedGroups', group.name)}
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-ink-950">{group.name}</span>
                          <span className="mt-1 block text-sm text-slate-500">{group.description}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
              <p className="max-w-3xl text-sm text-slate-500">
                Deletion stays blocked automatically whenever the queue later accumulates active or held jobs.
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="ui-button-ghost"
                  onClick={() => {
                    setDraft(getInitialDraft())
                    setCreateOpen(false)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="ui-button">
                  <Plus className="size-4" />
                  Create queue
                </button>
              </div>
            </div>
          </form>
        </section>
      ) : null}

      <AdvancedFilterPanel
        fields={[
          {
            id: 'status',
            label: 'Status',
            value: statusFilter,
            options: ['All statuses', 'Online', 'Offline', 'Maintenance'],
            onChange: setStatusFilter,
          },
          {
            id: 'audience',
            label: 'Audience',
            value: audienceFilter,
            options: ['All audiences', 'Students', 'Staff', 'Faculty', 'Mixed'],
            onChange: setAudienceFilter,
          },
          {
            id: 'release-mode',
            label: 'Release mode',
            value: releaseFilter,
            options: ['All release modes', 'Secure Release', 'Immediate', 'Kiosk Release'],
            onChange: setReleaseFilter,
          },
          {
            id: 'delete-state',
            label: 'Delete safety',
            value: deleteFilter,
            options: ['All delete states', 'Blocked by active jobs', 'Ready to delete'],
            onChange: setDeleteFilter,
          },
        ]}
        onAction={resetFilters}
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search queues, groups, or servers"
      >
        {(['All', 'Enabled only', 'Disabled only'] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={
              availability === value
                ? 'ui-button-secondary border-accent-500 text-accent-700'
                : 'ui-button-ghost'
            }
            onClick={() => setAvailability(value)}
          >
            {value}
          </button>
        ))}
      </FilterBar>

      <div className="mt-4">
        <DataTable<AdminQueue>
          columns={[
            {
              key: 'queue',
              header: 'Queue',
              render: (queue) => (
                <div>
                  <div className="font-semibold text-ink-950">{queue.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{queue.description}</div>
                </div>
              ),
            },
            {
              key: 'status',
              header: 'Status',
              render: (queue) => (
                <div className="space-y-2">
                  <StatusBadge status={queue.status} />
                  <div className="text-sm text-slate-500">{queue.enabled ? 'Enabled' : 'Disabled'}</div>
                </div>
              ),
            },
            {
              key: 'audience',
              header: 'Audience',
              render: (queue) => <span className="text-sm text-slate-600">{queue.audience}</span>,
            },
            {
              key: 'release',
              header: 'Release mode',
              render: (queue) => <span className="text-sm text-slate-600">{queue.releaseMode}</span>,
            },
            {
              key: 'assignment',
              header: 'Assignments',
              render: (queue) => (
                <span className="text-sm text-slate-600">
                  {queue.printerIds.length} printers · {queue.allowedGroups.length} groups
                </span>
              ),
            },
            {
              key: 'backlog',
              header: 'Backlog',
              render: (queue) => (
                <span className="text-sm text-slate-600">
                  {queue.pendingJobs} active · {queue.heldJobs} held
                </span>
              ),
            },
            {
              key: 'delete',
              header: 'Delete state',
              render: (queue) => (
                <span
                  className={
                    isDeleteBlocked(queue)
                      ? 'text-sm font-medium text-danger-500'
                      : 'text-sm font-medium text-accent-700'
                  }
                >
                  {getDeleteStateLabel(queue)}
                </span>
              ),
            },
          ]}
          rows={filteredQueues}
          getRowKey={(queue) => queue.id}
          onRowClick={(queue) => navigate(`/admin/queues/${queue.id}`)}
          emptyLabel="No queues match the current filters."
        />
      </div>
    </div>
  )
}

export function QueueDetailPage() {
  const navigate = useNavigate()
  const { queueId } = useParams()
  const queue = getQueueById(queueId)

  if (!queue) {
    return <Navigate to="/admin/queues" replace />
  }

  return <QueueDetailView key={queue.id} queue={queue} onBack={() => navigate('/admin/queues')} />
}

function QueueDetailView({ queue, onBack }: { queue: AdminQueue; onBack: () => void }) {
  const [activeTab, setActiveTab] = useState('Configuration')
  const [form, setForm] = useState(queue)
  const [saveMessage, setSaveMessage] = useState('')
  const [deleteReviewOpen, setDeleteReviewOpen] = useState(false)

  const assignedPrinters = adminPrinters.filter((printer) => form.printerIds.includes(printer.id))
  const openLogCount = form.queueLogs.filter((entry) => entry.state === 'Open').length
  const canDelete = !isDeleteBlocked(form)

  function updateForm<K extends keyof AdminQueue>(field: K, value: AdminQueue[K]) {
    setForm((current) => (current ? { ...current, [field]: value } : current))
  }

  function toggleAssignment(field: 'printerIds' | 'allowedGroups', value: string) {
    setForm((current) => {
      if (!current) {
        return current
      }

      const nextValues = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]

      return { ...current, [field]: nextValues }
    })
  }

  function resetForm() {
    const freshQueue = getQueueById(queue.id)
    setForm(freshQueue ?? queue)
    setSaveMessage('')
    setDeleteReviewOpen(false)
  }

  function handleApply() {
    if (!form) {
      return
    }

    const nextForm = {
      ...form,
      status: form.enabled ? form.status : 'Offline',
    }

    updateAdminQueue(nextForm)
    setForm(nextForm)
    setSaveMessage('Queue changes saved to the mock admin store.')
  }

  function handleDelete() {
    if (!form) {
      return
    }

    if (!canDelete) {
      setDeleteReviewOpen(true)
      return
    }

    deleteAdminQueue(form.id)
    onBack()
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title={`Queue details: ${form.name}`}
        description={`${form.audience} · ${form.releaseMode} · ${form.hostedOn}`}
        meta={
          <button type="button" className="ui-button-secondary" onClick={onBack}>
            Back to queues
          </button>
        }
      />

      <StatStrip
        items={[
          { label: 'Assigned printers', value: `${form.printerIds.length}`, hint: 'Release endpoints linked to this queue' },
          { label: 'Allowed groups', value: `${form.allowedGroups.length}`, hint: 'Access-limited membership scope' },
          { label: 'Released today', value: `${form.releasedToday}`, hint: form.lastActivity },
          { label: 'Held backlog', value: `${form.heldJobs}`, hint: `${form.pendingJobs} active jobs still in flow` },
        ]}
      />

      <ActionRail
        title="Queue actions"
        items={[
          {
            label: 'Review assignments',
            hint: 'See which printers can accept this queue.',
            icon: Printer,
            onClick: () => setActiveTab('Assignments'),
          },
          {
            label: 'Review release flow',
            hint: 'Check hold/release and failure-handling policy.',
            icon: ArrowRightLeft,
            onClick: () => setActiveTab('Configuration'),
          },
          {
            label: 'Open queue log',
            hint: 'Review queue faults, routing changes, and policy events.',
            icon: FileClock,
            onClick: () => setActiveTab('Queue log'),
          },
          {
            label: 'Delete queue',
            hint: canDelete ? 'No active or held jobs are blocking deletion.' : 'Deletion is blocked while jobs remain.',
            icon: Trash2,
            tone: 'danger',
            onClick: () => setDeleteReviewOpen(true),
          },
        ]}
      />

      {deleteReviewOpen || !canDelete ? (
        <section className="ui-panel mb-5 overflow-hidden">
          <div className={canDelete ? 'border-b border-line bg-accent-100/35 px-5 py-4' : 'border-b border-line bg-danger-100 px-5 py-4'}>
            <div className="flex items-start gap-3">
              {canDelete ? (
                <Check className="mt-0.5 size-5 text-accent-700" />
              ) : (
                <ShieldAlert className="mt-0.5 size-5 text-danger-500" />
              )}
              <div>
                <div className="ui-kicker text-slate-600">Deletion review</div>
                <div className="mt-1 text-base font-semibold text-ink-950">
                  {canDelete ? 'Queue can be deleted safely' : 'Deletion blocked while jobs remain in the queue'}
                </div>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                  {canDelete
                    ? 'There are no active or held jobs on this queue, so removal will not discard pending print work.'
                    : `This queue still has ${form.pendingJobs} active jobs and ${form.heldJobs} held jobs. Clear or redirect those jobs before deletion so work is not lost.`}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm text-slate-500">
              Failure mode: {form.failureMode} · Retention window: {form.autoDeleteAfterHours} hours
            </div>
            <div className="flex flex-wrap gap-2">
              {!canDelete ? (
                <>
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => setActiveTab('Assignments')}
                  >
                    Review assignments
                  </button>
                  <button
                    type="button"
                    className="ui-button-secondary"
                    onClick={() => setActiveTab('Queue log')}
                  >
                    Review queue log
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-none border border-danger-500 bg-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-500/90"
                  onClick={handleDelete}
                >
                  <Trash2 className="size-4" />
                  Delete queue
                </button>
              )}
              <button
                type="button"
                className="ui-button-ghost"
                onClick={() => setDeleteReviewOpen(false)}
              >
                Close review
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <SectionTabs
        tabs={['Configuration', 'Assignments', 'Queue log']}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'Configuration' ? (
        <section className="ui-panel overflow-hidden">
          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Queue details</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <div className="ui-heading">Queue name</div>
                <input
                  className="ui-input mt-2"
                  value={form.name}
                  onChange={(event) => updateForm('name', event.target.value)}
                />
              </label>
              <label>
                <div className="ui-heading">Hosted on</div>
                <input
                  className="ui-input mt-2"
                  value={form.hostedOn}
                  onChange={(event) => updateForm('hostedOn', event.target.value)}
                />
              </label>
              <label>
                <div className="ui-heading">Status</div>
                <select
                  className="ui-select mt-2 w-full"
                  value={form.status}
                  onChange={(event) =>
                    updateForm('status', event.target.value as AdminQueue['status'])
                  }
                >
                  <option>Online</option>
                  <option>Offline</option>
                  <option>Maintenance</option>
                </select>
              </label>
              <label>
                <div className="ui-heading">Audience</div>
                <select
                  className="ui-select mt-2 w-full"
                  value={form.audience}
                  onChange={(event) =>
                    updateForm('audience', event.target.value as QueueAccessScope)
                  }
                >
                  <option>Students</option>
                  <option>Staff</option>
                  <option>Faculty</option>
                  <option>Mixed</option>
                </select>
              </label>
              <label>
                <div className="ui-heading">Department</div>
                <input
                  className="ui-input mt-2"
                  value={form.department}
                  onChange={(event) => updateForm('department', event.target.value)}
                />
              </label>
              <label className="lg:col-span-2">
                <div className="ui-heading">Description</div>
                <textarea
                  className="ui-textarea mt-2"
                  value={form.description}
                  onChange={(event) => updateForm('description', event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Release and retention</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label className="flex items-center gap-3 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={form.enabled}
                  onChange={(event) => updateForm('enabled', event.target.checked)}
                />
                <span className="text-sm text-ink-950">Queue enabled for submission and release</span>
              </label>
              <label>
                <div className="ui-heading">Release mode</div>
                <select
                  className="ui-select mt-2 w-full"
                  value={form.releaseMode}
                  onChange={(event) =>
                    updateForm('releaseMode', event.target.value as QueueReleaseMode)
                  }
                >
                  <option>Secure Release</option>
                  <option>Immediate</option>
                  <option>Kiosk Release</option>
                </select>
              </label>
              <label>
                <div className="ui-heading">Color mode</div>
                <select
                  className="ui-select mt-2 w-full"
                  value={form.colorMode}
                  onChange={(event) =>
                    updateForm('colorMode', event.target.value as AdminQueue['colorMode'])
                  }
                >
                  <option>Black & White</option>
                  <option>Color</option>
                </select>
              </label>
              <label>
                <div className="ui-heading">Cost per page</div>
                <input
                  type="number"
                  step="0.01"
                  className="ui-input mt-2"
                  value={form.costPerPage}
                  onChange={(event) => updateForm('costPerPage', Number(event.target.value))}
                />
              </label>
              <label>
                <div className="ui-heading">Auto-delete after (hours)</div>
                <input
                  type="number"
                  className="ui-input mt-2"
                  value={form.autoDeleteAfterHours}
                  onChange={(event) =>
                    updateForm('autoDeleteAfterHours', Number(event.target.value))
                  }
                />
              </label>
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={form.defaultDuplex}
                  onChange={(event) => updateForm('defaultDuplex', event.target.checked)}
                />
                <span className="text-sm text-ink-950">Default jobs to duplex printing</span>
              </label>
              <div className="flex items-end">
                <div className="text-sm text-slate-500">
                  Current rate: <span className="font-semibold text-ink-950">{formatCurrency(form.costPerPage)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Failure handling</div>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <label>
                <div className="ui-heading">Failure mode</div>
                <select
                  className="ui-select mt-2 w-full"
                  value={form.failureMode}
                  onChange={(event) =>
                    updateForm('failureMode', event.target.value as AdminQueue['failureMode'])
                  }
                >
                  <option>Hold until redirected</option>
                  <option>Retry then notify</option>
                  <option>Cancel and notify</option>
                </select>
              </label>
              <div className="flex items-end">
                <div className="rounded-none border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">
                  Delete status: <span className={canDelete ? 'font-semibold text-accent-700' : 'font-semibold text-danger-500'}>{getDeleteStateLabel(form)}</span>
                </div>
              </div>
              <label className="lg:col-span-2">
                <div className="ui-heading">Notes</div>
                <textarea
                  className="ui-textarea mt-2"
                  value={form.notes}
                  onChange={(event) => updateForm('notes', event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm text-slate-500">{saveMessage || 'Review the queue policy and apply when the form is ready.'}</div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ui-button-ghost" onClick={resetForm}>
                <RotateCcw className="size-4" />
                Reset
              </button>
              <button type="button" className="ui-button" onClick={handleApply}>
                <Save className="size-4" />
                Apply
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'Assignments' ? (
        <section className="ui-panel overflow-hidden">
          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Printer assignment</div>
            </div>
            <div className="grid gap-3">
              <div className="text-sm text-slate-500">
                A printer can only be assigned to one queue. Reassigning it here removes it from the previous queue record.
              </div>
              {adminPrinters.map((printer) => (
                <label
                  key={printer.id}
                  className="flex flex-col gap-3 border border-line bg-white px-4 py-4 lg:flex-row lg:items-start lg:justify-between"
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={form.printerIds.includes(printer.id)}
                      onChange={() => toggleAssignment('printerIds', printer.id)}
                    />
                    <div>
                      <div className="text-sm font-semibold text-ink-950">{printer.name}</div>
                      <div className="mt-1 text-sm text-slate-500">
                        {printer.location} · {printer.model}
                      </div>
                      <div className="mt-2 text-sm text-slate-500">
                        {printer.pendingJobs} held jobs currently on device queue
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={printer.status} />
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="text-sm font-medium text-ink-950">Access scope</div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {adminGroups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-start gap-3 border border-line bg-mist-50 px-4 py-4"
                >
                  <input
                    type="checkbox"
                    checked={form.allowedGroups.includes(group.name)}
                    onChange={() => toggleAssignment('allowedGroups', group.name)}
                  />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-ink-950">{group.name}</span>
                    <span className="mt-1 block text-sm text-slate-500">
                      {group.userCount} users · {group.schedule} quota schedule
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="px-5 py-5">
            <div className="ui-heading">Assigned printer summary</div>
            <div className="mt-4">
              <DataTable
                columns={[
                  {
                    key: 'printer',
                    header: 'Printer',
                    render: (printer: (typeof adminPrinters)[number]) => (
                      <span className="font-semibold text-ink-950">{printer.name}</span>
                    ),
                  },
                  {
                    key: 'location',
                    header: 'Location',
                    render: (printer: (typeof adminPrinters)[number]) => (
                      <span className="text-sm text-slate-600">{printer.location}</span>
                    ),
                  },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (printer: (typeof adminPrinters)[number]) => <StatusBadge status={printer.status} />,
                  },
                  {
                    key: 'held',
                    header: 'Held jobs',
                    render: (printer: (typeof adminPrinters)[number]) => (
                      <span className="text-sm text-slate-600">{printer.pendingJobs}</span>
                    ),
                  },
                ]}
                rows={assignedPrinters}
                getRowKey={(printer: (typeof adminPrinters)[number]) => printer.id}
                emptyLabel="No printers are currently assigned to this queue."
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="text-sm text-slate-500">
              Assignment changes do not override queue deletion safeguards while jobs are active.
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="ui-button-secondary" onClick={() => setActiveTab('Queue log')}>
                <AlertTriangle className="size-4" />
                Review queue log
              </button>
              <button type="button" className="ui-button" onClick={handleApply}>
                <Save className="size-4" />
                Apply assignments
              </button>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'Queue log' ? (
        <section className="ui-panel overflow-hidden">
          <div className="grid gap-0 border-b border-line md:grid-cols-4">
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Open incidents</div>
              <div className="mt-3 text-lg font-semibold text-ink-950">{openLogCount}</div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Held jobs</div>
              <div className="mt-3 text-lg font-semibold text-ink-950">{form.heldJobs}</div>
            </div>
            <div className="border-b border-line px-5 py-4 md:border-r md:border-b-0">
              <div className="ui-heading">Last activity</div>
              <div className="mt-3 text-lg font-semibold text-ink-950">{form.lastActivity}</div>
            </div>
            <div className="px-5 py-4">
              <div className="ui-heading">Delete state</div>
              <div className="mt-3 text-sm font-semibold text-ink-950">{getDeleteStateLabel(form)}</div>
            </div>
          </div>

          {!canDelete ? (
            <div className="border-b border-line bg-danger-100/70 px-5 py-4 text-sm text-danger-500">
              Deletion is currently blocked because the queue still contains active or held work that needs review.
            </div>
          ) : null}

          <div className="px-5 py-5">
            <DataTable<QueueLogEntry>
              columns={[
                {
                  key: 'time',
                  header: 'Time',
                  render: (entry) => <span className="font-mono text-xs text-ink-950">{entry.time}</span>,
                },
                {
                  key: 'type',
                  header: 'Type',
                  render: (entry) => <span className="text-sm text-slate-600">{entry.type}</span>,
                },
                {
                  key: 'actor',
                  header: 'Actor',
                  render: (entry) => <span className="text-sm text-slate-600">{entry.actor}</span>,
                },
                {
                  key: 'message',
                  header: 'Event',
                  render: (entry) => <span className="text-sm text-slate-600">{entry.message}</span>,
                },
                {
                  key: 'state',
                  header: 'State',
                  render: (entry) => <QueueLogStateBadge state={entry.state} />,
                },
              ]}
              rows={form.queueLogs}
              getRowKey={(entry) => entry.id}
              emptyLabel="No queue log entries are available."
            />
          </div>
        </section>
      ) : null}
    </div>
  )
}
