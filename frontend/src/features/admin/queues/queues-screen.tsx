import { Plus, Power, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ActionRail } from '@/components/composite/action-rail'
import { AdvancedFilterPanel } from '@/components/composite/advanced-filter-panel'
import { FilterBar } from '@/components/composite/filter-bar'
import { PageHeader } from '@/components/composite/page-header'
import { StatStrip } from '@/components/composite/stat-strip'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { getQueueDeleteStateLabel, isQueueDeleteBlocked } from '@/lib/status'
import { createQueue, listQueues } from './api'
import { QueueCreatePanel } from './components/queue-create-panel'
import { useQueueFilters } from './hooks/use-queue-filters'
import { useQueueForm } from './hooks/use-queue-form'
import type { AdminQueue } from '@/types/admin'

export function QueuesScreen() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState(() => listQueues())
  const { availability, audienceFilter, deleteFilter, filteredQueues, queueMetrics, releaseFilter, resetFilters, search, setAudienceFilter, setAvailability, setDeleteFilter, setReleaseFilter, setSearch, setStatusFilter, statusFilter } = useQueueFilters(queues)
  const { draft, isCreateOpen, resetDraft, setCreateOpen, setDraft, toggleDraftSelection } = useQueueForm()

  function handleCreateQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedName = draft.name.trim()
    const newQueueId = `que-${Date.now().toString(36)}`
    const createdQueue: AdminQueue = {
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

    createQueue(createdQueue)
    setQueues(listQueues())
    resetDraft()
    setCreateOpen(false)
    navigate(`/admin/queues/${createdQueue.id}`)
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title="Queue management"
        description="Dedicated queue CRUD, assignment, hold/release policy, and deletion-safety surface for the admin console."
        meta={<button type="button" className="ui-button" onClick={() => setCreateOpen(true)}><Plus className="size-4" />New queue</button>}
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
          { label: 'Create queue draft', hint: 'Define routing, release mode, and audience scope.', icon: Plus, onClick: () => setCreateOpen(true) },
          { label: 'Review printer assignment', hint: 'Check which queues can release on each device.', icon: Printer },
          { label: 'Toggle queue availability', hint: 'Enable or disable queues without deleting the record.', icon: Power },
          { label: 'Delete queue', hint: 'Blocked whenever active or held jobs remain.', icon: Trash2, tone: 'danger' },
        ]}
      />

      {isCreateOpen ? <QueueCreatePanel draft={draft} onCancel={() => { resetDraft(); setCreateOpen(false) }} onSubmit={handleCreateQueue} setDraft={setDraft} toggleDraftSelection={toggleDraftSelection} /> : null}

      <AdvancedFilterPanel
        fields={[
          { id: 'status', label: 'Status', value: statusFilter, options: ['All statuses', 'Online', 'Offline', 'Maintenance'], onChange: setStatusFilter },
          { id: 'audience', label: 'Audience', value: audienceFilter, options: ['All audiences', 'Students', 'Staff', 'Faculty', 'Mixed'], onChange: setAudienceFilter },
          { id: 'release-mode', label: 'Release mode', value: releaseFilter, options: ['All release modes', 'Secure Release', 'Immediate', 'Kiosk Release'], onChange: setReleaseFilter },
          { id: 'delete-state', label: 'Delete safety', value: deleteFilter, options: ['All delete states', 'Blocked by active jobs', 'Ready to delete'], onChange: setDeleteFilter },
        ]}
        onAction={resetFilters}
      />

      <FilterBar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search queues, groups, or servers">
        {(['All', 'Enabled only', 'Disabled only'] as const).map((value) => (
          <button key={value} type="button" className={availability === value ? 'ui-button-secondary border-accent-500 text-accent-700' : 'ui-button-ghost'} onClick={() => setAvailability(value)}>
            {value}
          </button>
        ))}
      </FilterBar>

      <div className="mt-4">
        <DataTable<AdminQueue>
          columns={[
            { key: 'queue', header: 'Queue', render: (queue) => <div><div className="font-semibold text-ink-950">{queue.name}</div><div className="mt-1 text-sm text-slate-500">{queue.description}</div></div> },
            { key: 'status', header: 'Status', render: (queue) => <div className="space-y-2"><StatusBadge status={queue.status} /><div className="text-sm text-slate-500">{queue.enabled ? 'Enabled' : 'Disabled'}</div></div> },
            { key: 'audience', header: 'Audience', render: (queue) => <span className="text-sm text-slate-600">{queue.audience}</span> },
            { key: 'release', header: 'Release mode', render: (queue) => <span className="text-sm text-slate-600">{queue.releaseMode}</span> },
            { key: 'assignment', header: 'Assignments', render: (queue) => <span className="text-sm text-slate-600">{queue.printerIds.length} printers · {queue.allowedGroups.length} groups</span> },
            { key: 'backlog', header: 'Backlog', render: (queue) => <span className="text-sm text-slate-600">{queue.pendingJobs} active · {queue.heldJobs} held</span> },
            { key: 'delete', header: 'Delete state', render: (queue) => <span className={isQueueDeleteBlocked(queue) ? 'text-sm font-medium text-danger-500' : 'text-sm font-medium text-accent-700'}>{getQueueDeleteStateLabel(queue)}</span> },
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
