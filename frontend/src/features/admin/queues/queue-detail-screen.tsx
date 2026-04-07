import { ArrowRightLeft, FileClock, Printer, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ActionRail } from '@/components/composite/action-rail'
import { PageHeader } from '@/components/composite/page-header'
import { SectionTabs } from '@/components/composite/section-tabs'
import { StatStrip } from '@/components/composite/stat-strip'
import { isQueueDeleteBlocked } from '@/lib/status'
import { getQueueByIdOrUndefined, listQueuePrinters, removeQueue, saveQueue } from './api'
import { QueueAssignmentsPanel } from './components/queue-assignments-panel'
import { QueueConfigurationPanel } from './components/queue-configuration-panel'
import { QueueDeleteReview } from './components/queue-delete-review'
import { QueueLogPanel } from './components/queue-log-panel'
import type { AdminQueue } from '@/types/admin'

export function QueueDetailScreen() {
  const navigate = useNavigate()
  const { queueId } = useParams()
  const queue = getQueueByIdOrUndefined(queueId)

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
  const assignedPrinters = listQueuePrinters().filter((printer) => form.printerIds.includes(printer.id))
  const openLogCount = form.queueLogs.filter((entry) => entry.state === 'Open').length
  const canDelete = !isQueueDeleteBlocked(form)

  function updateForm<K extends keyof AdminQueue>(field: K, value: AdminQueue[K]) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function toggleAssignment(field: 'printerIds' | 'allowedGroups', value: string) {
    setForm((current) => {
      const nextValues = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value]

      return { ...current, [field]: nextValues }
    })
  }

  function resetForm() {
    const freshQueue = getQueueByIdOrUndefined(queue.id)
    setForm(freshQueue ?? queue)
    setSaveMessage('')
    setDeleteReviewOpen(false)
  }

  function handleApply() {
    const nextForm = { ...form, status: form.enabled ? form.status : 'Offline' }
    saveQueue(nextForm)
    setForm(nextForm)
    setSaveMessage('Queue changes saved to the mock admin store.')
  }

  function handleDelete() {
    if (!canDelete) {
      setDeleteReviewOpen(true)
      return
    }

    removeQueue(form.id)
    onBack()
  }

  return (
    <div className="min-w-0">
      <PageHeader
        eyebrow="Queues"
        title={`Queue details: ${form.name}`}
        description={`${form.audience} · ${form.releaseMode} · ${form.hostedOn}`}
        meta={<button type="button" className="ui-button-secondary" onClick={onBack}>Back to queues</button>}
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
          { label: 'Review assignments', hint: 'See which printers can accept this queue.', icon: Printer, onClick: () => setActiveTab('Assignments') },
          { label: 'Review release flow', hint: 'Check hold/release and failure-handling policy.', icon: ArrowRightLeft, onClick: () => setActiveTab('Configuration') },
          { label: 'Open queue log', hint: 'Review queue faults, routing changes, and policy events.', icon: FileClock, onClick: () => setActiveTab('Queue log') },
          { label: 'Delete queue', hint: canDelete ? 'No active or held jobs are blocking deletion.' : 'Deletion is blocked while jobs remain.', icon: Trash2, tone: 'danger', onClick: () => setDeleteReviewOpen(true) },
        ]}
      />

      {deleteReviewOpen || !canDelete ? <QueueDeleteReview canDelete={canDelete} form={form} onClose={() => setDeleteReviewOpen(false)} onDelete={handleDelete} onReviewAssignments={() => setActiveTab('Assignments')} onReviewLog={() => setActiveTab('Queue log')} /> : null}

      <SectionTabs tabs={['Configuration', 'Assignments', 'Queue log']} activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'Configuration' ? <QueueConfigurationPanel canDelete={canDelete} form={form} onApply={handleApply} onReset={resetForm} saveMessage={saveMessage} updateForm={updateForm} /> : null}
      {activeTab === 'Assignments' ? <QueueAssignmentsPanel assignedPrinters={assignedPrinters} form={form} onApply={handleApply} onReviewLog={() => setActiveTab('Queue log')} toggleAssignment={toggleAssignment} /> : null}
      {activeTab === 'Queue log' ? <QueueLogPanel canDelete={canDelete} form={form} openLogCount={openLogCount} /> : null}
    </div>
  )
}
