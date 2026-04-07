import { Check, ShieldAlert, Trash2 } from 'lucide-react'
import type { AdminQueue } from '@/types/admin'

interface QueueDeleteReviewProps {
  canDelete: boolean
  form: AdminQueue
  onClose: () => void
  onDelete: () => void
  onReviewAssignments: () => void
  onReviewLog: () => void
}

export function QueueDeleteReview({
  canDelete,
  form,
  onClose,
  onDelete,
  onReviewAssignments,
  onReviewLog,
}: QueueDeleteReviewProps) {
  return (
    <section className="ui-panel mb-5 overflow-hidden">
      <div className={canDelete ? 'border-b border-line bg-accent-100/35 px-5 py-4' : 'border-b border-line bg-danger-100 px-5 py-4'}>
        <div className="flex items-start gap-3">
          {canDelete ? <Check className="mt-0.5 size-5 text-accent-700" /> : <ShieldAlert className="mt-0.5 size-5 text-danger-500" />}
          <div>
            <div className="ui-kicker text-slate-600">Deletion review</div>
            <div className="mt-1 text-base font-semibold text-ink-950">{canDelete ? 'Queue can be deleted safely' : 'Deletion blocked while jobs remain in the queue'}</div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              {canDelete
                ? 'There are no active or held jobs on this queue, so removal will not discard pending print work.'
                : `This queue still has ${form.pendingJobs} active jobs and ${form.heldJobs} held jobs. Clear or redirect those jobs before deletion so work is not lost.`}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-500">Failure mode: {form.failureMode} · Retention window: {form.autoDeleteAfterHours} hours</div>
        <div className="flex flex-wrap gap-2">
          {!canDelete ? (
            <>
              <button type="button" className="ui-button-secondary" onClick={onReviewAssignments}>Review assignments</button>
              <button type="button" className="ui-button-secondary" onClick={onReviewLog}>Review queue log</button>
            </>
          ) : (
            <button type="button" className="inline-flex items-center justify-center gap-2 rounded-none border border-danger-500 bg-danger-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-danger-500/90" onClick={onDelete}>
              <Trash2 className="size-4" />
              Delete queue
            </button>
          )}
          <button type="button" className="ui-button-ghost" onClick={onClose}>Close review</button>
        </div>
      </div>
    </section>
  )
}
