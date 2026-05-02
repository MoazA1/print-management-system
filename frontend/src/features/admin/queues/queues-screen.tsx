import { useCallback, useDeferredValue, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { QueuesHeader } from '@/components/queue/QueuesHeader'
import { QueuesTable } from '@/components/queue/QueuesTable'
import { QueuesToolbar, type QueueStatusFilter } from '@/components/queue/QueuesToolbar'
import { listGroups } from '@/features/admin/groups/api'
import { listPrinters } from '@/features/admin/printers/api'
import { createQueue, listQueues, type QueueMutationInput } from './api'
import { QueueCreatePanel } from './components/queue-create-panel'
import { useQueueForm } from './hooks/use-queue-form'
import type { AdminGroup, AdminPrinter, AdminQueue } from '@/types/admin'

export function QueuesScreen() {
  const navigate = useNavigate()
  const [queues, setQueues] = useState<AdminQueue[]>([])
  const [printers, setPrinters] = useState<AdminPrinter[]>([])
  const [groups, setGroups] = useState<AdminGroup[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<QueueStatusFilter>('All statuses')
  const [isCreatingQueue, setIsCreatingQueue] = useState(false)
  const deferredSearch = useDeferredValue(search)
  const { draft, isCreateOpen, resetDraft, setCreateOpen, setDraft, toggleDraftSelection } = useQueueForm()

  const loadQueues = useCallback(
    () =>
      listQueues({
        search: deferredSearch,
        status,
        limit: 100,
      }),
    [deferredSearch, status],
  )

  useEffect(() => {
    let cancelled = false

    loadQueues()
      .then((nextQueues) => {
        if (!cancelled) {
          setQueues(nextQueues)
          setLoadError(null)
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : 'Unable to load queues.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [loadQueues])

  useEffect(() => {
    let cancelled = false

    Promise.all([
      listPrinters({ limit: 100 }),
      listGroups({ limit: 100 }),
    ])
      .then(([nextPrinters, nextGroups]) => {
        if (!cancelled) {
          setPrinters(nextPrinters)
          setGroups(nextGroups)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setPrinters([])
          setGroups([])
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  function resetFilters() {
    setSearch('')
    setStatus('All statuses')
  }

  async function handleCreateQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const input: QueueMutationInput = {
      name: draft.name.trim() || 'New queue',
      description: draft.description.trim(),
      status: draft.enabled ? 'Online' : 'Offline',
      releaseMode: draft.releaseMode,
      audience: draft.audience,
      retentionHours: 24,
      costPerPage: 0.05,
      printerIds: draft.printerIds,
      allowedGroups: draft.allowedGroups,
    }

    setIsCreatingQueue(true)
    try {
      const createdQueue = await createQueue(input)
      const nextQueues = await loadQueues()
      setQueues(nextQueues)
      resetDraft()
      setCreateOpen(false)
      toast.success('Queue has been added', {
        description: `${createdQueue.name} is now saved in the database.`,
      })
      navigate(`/admin/queues/${createdQueue.id}`)
    } catch (error) {
      toast.error('Unable to create queue', {
        description: error instanceof Error ? error.message : 'Please try again.',
      })
    } finally {
      setIsCreatingQueue(false)
    }
  }

  return (
    <div className="min-w-0">
      <QueuesHeader />

      {isCreateOpen ? (
        <QueueCreatePanel
          draft={draft}
          groups={groups}
          printers={printers}
          onCancel={() => {
            resetDraft()
            setCreateOpen(false)
          }}
          onSubmit={handleCreateQueue}
          setDraft={setDraft}
          toggleDraftSelection={toggleDraftSelection}
        />
      ) : null}

      <QueuesToolbar
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onReset={resetFilters}
        onAddQueue={() => setCreateOpen(true)}
      />

      {loadError ? (
        <div className="mt-4 border border-danger-500/30 bg-danger-100 px-4 py-3 text-sm text-danger-500">
          {loadError}
        </div>
      ) : null}

      {isCreatingQueue ? (
        <div className="mt-4 border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">
          Creating queue...
        </div>
      ) : null}

      <div className="mt-4">
        <QueuesTable rows={queues} onRowClick={(queue) => navigate(`/admin/queues/${queue.id}`)} />
      </div>
    </div>
  )
}
