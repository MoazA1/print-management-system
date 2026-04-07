import { RotateCcw, Save } from 'lucide-react'
import { formatSar } from '@/lib/formatters'
import { getQueueDeleteStateLabel } from '@/lib/status'
import type { AdminQueue, QueueAccessScope, QueueReleaseMode } from '@/types/admin'

interface QueueConfigurationPanelProps {
  canDelete: boolean
  form: AdminQueue
  onApply: () => void
  onReset: () => void
  saveMessage: string
  updateForm: <K extends keyof AdminQueue>(field: K, value: AdminQueue[K]) => void
}

export function QueueConfigurationPanel({
  canDelete,
  form,
  onApply,
  onReset,
  saveMessage,
  updateForm,
}: QueueConfigurationPanelProps) {
  return (
    <section className="ui-panel overflow-hidden">
      <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><div className="text-sm font-medium text-ink-950">Queue details</div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label><div className="ui-heading">Queue name</div><input className="ui-input mt-2" value={form.name} onChange={(event) => updateForm('name', event.target.value)} /></label>
          <label><div className="ui-heading">Hosted on</div><input className="ui-input mt-2" value={form.hostedOn} onChange={(event) => updateForm('hostedOn', event.target.value)} /></label>
          <label><div className="ui-heading">Status</div><select className="ui-select mt-2 w-full" value={form.status} onChange={(event) => updateForm('status', event.target.value as AdminQueue['status'])}><option>Online</option><option>Offline</option><option>Maintenance</option></select></label>
          <label><div className="ui-heading">Audience</div><select className="ui-select mt-2 w-full" value={form.audience} onChange={(event) => updateForm('audience', event.target.value as QueueAccessScope)}><option>Students</option><option>Staff</option><option>Faculty</option><option>Mixed</option></select></label>
          <label><div className="ui-heading">Department</div><input className="ui-input mt-2" value={form.department} onChange={(event) => updateForm('department', event.target.value)} /></label>
          <label className="lg:col-span-2"><div className="ui-heading">Description</div><textarea className="ui-textarea mt-2" value={form.description} onChange={(event) => updateForm('description', event.target.value)} /></label>
        </div>
      </div>

      <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><div className="text-sm font-medium text-ink-950">Release and retention</div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="flex items-center gap-3 lg:col-span-2"><input type="checkbox" checked={form.enabled} onChange={(event) => updateForm('enabled', event.target.checked)} /><span className="text-sm text-ink-950">Queue enabled for submission and release</span></label>
          <label><div className="ui-heading">Release mode</div><select className="ui-select mt-2 w-full" value={form.releaseMode} onChange={(event) => updateForm('releaseMode', event.target.value as QueueReleaseMode)}><option>Secure Release</option><option>Immediate</option><option>Kiosk Release</option></select></label>
          <label><div className="ui-heading">Color mode</div><select className="ui-select mt-2 w-full" value={form.colorMode} onChange={(event) => updateForm('colorMode', event.target.value as AdminQueue['colorMode'])}><option>Black & White</option><option>Color</option></select></label>
          <label><div className="ui-heading">Cost per page</div><input type="number" step="0.01" className="ui-input mt-2" value={form.costPerPage} onChange={(event) => updateForm('costPerPage', Number(event.target.value))} /></label>
          <label><div className="ui-heading">Auto-delete after (hours)</div><input type="number" className="ui-input mt-2" value={form.autoDeleteAfterHours} onChange={(event) => updateForm('autoDeleteAfterHours', Number(event.target.value))} /></label>
          <label className="flex items-center gap-3"><input type="checkbox" checked={form.defaultDuplex} onChange={(event) => updateForm('defaultDuplex', event.target.checked)} /><span className="text-sm text-ink-950">Default jobs to duplex printing</span></label>
          <div className="flex items-end"><div className="text-sm text-slate-500">Current rate: <span className="font-semibold text-ink-950">{formatSar(form.costPerPage)}</span></div></div>
        </div>
      </div>

      <div className="grid gap-6 border-b border-line px-5 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div><div className="text-sm font-medium text-ink-950">Failure handling</div></div>
        <div className="grid gap-4 lg:grid-cols-2">
          <label><div className="ui-heading">Failure mode</div><select className="ui-select mt-2 w-full" value={form.failureMode} onChange={(event) => updateForm('failureMode', event.target.value as AdminQueue['failureMode'])}><option>Hold until redirected</option><option>Retry then notify</option><option>Cancel and notify</option></select></label>
          <div className="flex items-end"><div className="rounded-none border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">Delete status: <span className={canDelete ? 'font-semibold text-accent-700' : 'font-semibold text-danger-500'}>{getQueueDeleteStateLabel(form)}</span></div></div>
          <label className="lg:col-span-2"><div className="ui-heading">Notes</div><textarea className="ui-textarea mt-2" value={form.notes} onChange={(event) => updateForm('notes', event.target.value)} /></label>
        </div>
      </div>

      <div className="flex flex-col gap-3 px-5 py-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="text-sm text-slate-500">{saveMessage || 'Review the queue policy and apply when the form is ready.'}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="ui-button-ghost" onClick={onReset}><RotateCcw className="size-4" />Reset</button>
          <button type="button" className="ui-button" onClick={onApply}><Save className="size-4" />Apply</button>
        </div>
      </div>
    </section>
  )
}
