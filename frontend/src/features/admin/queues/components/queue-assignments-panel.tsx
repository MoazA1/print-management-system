import { AlertTriangle, Save } from 'lucide-react'
import { DataTable } from '@/components/ui/data-table'
import { StatusBadge } from '@/components/ui/status-badge'
import { listQueueGroups, listQueuePrinters } from '@/features/admin/queues/api'
import type { AdminPrinter } from '@/types/admin'

interface QueueAssignmentsPanelProps {
  assignedPrinters: AdminPrinter[]
  form: {
    allowedGroups: string[]
    printerIds: string[]
  }
  onApply: () => void
  onReviewLog: () => void
  toggleAssignment: (field: 'printerIds' | 'allowedGroups', value: string) => void
}

export function QueueAssignmentsPanel({
  assignedPrinters,
  form,
  onApply,
  onReviewLog,
  toggleAssignment,
}: QueueAssignmentsPanelProps) {
  const printers = listQueuePrinters()
  const groups = listQueueGroups()

  return (
    <section className="ui-panel overflow-hidden">
      <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><div className="text-sm font-medium text-ink-950">Printer assignment</div></div>
        <div className="grid gap-3">
          <div className="text-sm text-slate-500">A printer can only be assigned to one queue. Reassigning it here removes it from the previous queue record.</div>
          {printers.map((printer) => (
            <label key={printer.id} className="flex flex-col gap-3 border border-line bg-white px-4 py-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <input type="checkbox" checked={form.printerIds.includes(printer.id)} onChange={() => toggleAssignment('printerIds', printer.id)} />
                <div>
                  <div className="text-sm font-semibold text-ink-950">{printer.name}</div>
                  <div className="mt-1 text-sm text-slate-500">{printer.location} · {printer.model}</div>
                  <div className="mt-2 text-sm text-slate-500">{printer.pendingJobs} held jobs currently on device queue</div>
                </div>
              </div>
              <StatusBadge status={printer.status} />
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><div className="text-sm font-medium text-ink-950">Access scope</div></div>
        <div className="grid gap-3 md:grid-cols-2">
          {groups.map((group) => (
            <label key={group.id} className="flex items-start gap-3 border border-line bg-mist-50 px-4 py-4">
              <input type="checkbox" checked={form.allowedGroups.includes(group.name)} onChange={() => toggleAssignment('allowedGroups', group.name)} />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-ink-950">{group.name}</span>
                <span className="mt-1 block text-sm text-slate-500">{group.userCount} users · {group.schedule} quota schedule</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="px-5 py-5">
        <div className="ui-heading">Assigned printer summary</div>
        <div className="mt-4">
          <DataTable<AdminPrinter>
            columns={[
              { key: 'printer', header: 'Printer', render: (printer) => <span className="font-semibold text-ink-950">{printer.name}</span> },
              { key: 'location', header: 'Location', render: (printer) => <span className="text-sm text-slate-600">{printer.location}</span> },
              { key: 'status', header: 'Status', render: (printer) => <StatusBadge status={printer.status} /> },
              { key: 'held', header: 'Held jobs', render: (printer) => <span className="text-sm text-slate-600">{printer.pendingJobs}</span> },
            ]}
            rows={assignedPrinters}
            getRowKey={(printer) => printer.id}
            emptyLabel="No printers are currently assigned to this queue."
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-500">Assignment changes do not override queue deletion safeguards while jobs are active.</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ui-button-secondary" onClick={onReviewLog}><AlertTriangle className="size-4" />Review queue log</button>
          <button type="button" className="ui-button" onClick={onApply}><Save className="size-4" />Apply assignments</button>
        </div>
      </div>
    </section>
  )
}
