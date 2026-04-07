import { useState } from 'react'
import { buildLinePoints } from '@/lib/charts'
import { formatUsd } from '@/lib/formatters'
import { DashboardActiveJob, PortalMetric, RecentPortalJobsTable } from '@/features/portal/shared/components'
import { cancelDashboardJob, getPortalDashboardSnapshot } from './api'

const usageLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PortalDashboardScreen() {
  const [snapshot, setSnapshot] = useState(() => getPortalDashboardSnapshot())
  const { jobs, profile, weeklyUsage } = snapshot
  const activeJobs = jobs.filter((job) => job.status === 'Pending Release' || job.status === 'In Progress')
  const completedJobs = jobs.filter((job) => job.status === 'Completed')
  const totalCost = completedJobs.reduce((sum, job) => sum + job.cost, 0)
  const totalPages = completedJobs.reduce((sum, job) => sum + job.totalPages, 0)
  const quotaRemaining = profile.quotaTotal - profile.quotaUsed
  const linePoints = buildLinePoints(weeklyUsage, 440, 120)

  function handleCancel(jobId: string) {
    if (cancelDashboardJob(jobId)) {
      setSnapshot(getPortalDashboardSnapshot())
    }
  }

  return (
    <div className="min-w-0">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PortalMetric label="Completed pages" value={`${totalPages}`} hint="Completed jobs only" />
        <PortalMetric label="Completed cost" value={formatUsd(totalCost)} hint="Calculated from job records" />
        <PortalMetric
          label="Quota used"
          value={`${Math.round((profile.quotaUsed / profile.quotaTotal) * 100)}%`}
          hint={`${profile.quotaUsed} of ${profile.quotaTotal} pages`}
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
                <polyline fill="none" points={linePoints} transform="translate(0 10)" stroke="#0f7a4b" strokeWidth="3" />
                {linePoints.split(' ').map((point, index) => {
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
              {profile.quotaUsed}/{profile.quotaTotal}
            </div>
            <div className="mt-4 h-3 bg-slate-100">
              <div className="h-full bg-sky-600" style={{ width: `${(profile.quotaUsed / profile.quotaTotal) * 100}%` }} />
            </div>
            <div className="mt-3 text-sm text-slate-500">{quotaRemaining} pages remaining this period.</div>
            <div className="mt-4 border border-line bg-mist-50 px-4 py-3 text-sm text-slate-600">
              Pending or unreleased files are purged after {profile.retentionHours} hours.
            </div>
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_420px]">
        <RecentPortalJobsTable jobs={jobs} />

        <section className="ui-panel overflow-hidden">
          <div className="border-b border-line bg-mist-50/80 px-5 py-4">
            <div className="text-base font-semibold text-ink-950">Active job actions</div>
            <div className="mt-1 text-sm text-slate-500">Cancel pending jobs before release or watch jobs already in progress.</div>
          </div>
          <div className="px-5 py-3">
            {activeJobs.length === 0 ? <div className="py-8 text-sm text-slate-500">No active jobs right now.</div> : activeJobs.map((job) => <DashboardActiveJob key={job.id} job={job} onCancel={handleCancel} />)}
          </div>
        </section>
      </div>
    </div>
  )
}
