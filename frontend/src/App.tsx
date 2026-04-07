import { Navigate, Route, Routes } from 'react-router-dom'
import { AdminShell } from './components/layout/admin-shell'
import { UserShell } from './components/layout/user-shell'
import { DashboardPage } from './pages/dashboard-page'
import { GroupDetailPage, GroupsPage } from './pages/groups-page'
import { NotFoundPage } from './pages/not-found-page'
import {
  PortalDashboardPage,
  PortalHistoryPage,
  PortalSubmitJobPage,
} from './pages/portal-pages'
import { PrinterDetailPage, PrintersPage } from './pages/printers-page'
import { QueueDetailPage, QueuesPage } from './pages/queues-page'
import {
  AboutPage,
  AccountsPage,
  DevicesPage,
  LogsPage,
  OptionsPage,
  ReportsPage,
} from './pages/system-pages'
import { UserDetailPage, UsersPage } from './pages/users-page'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/portal/dashboard" replace />} />
      <Route path="/portal" element={<UserShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<PortalDashboardPage />} />
        <Route path="submit-job" element={<PortalSubmitJobPage />} />
        <Route path="history" element={<PortalHistoryPage />} />
      </Route>
      <Route path="/admin" element={<AdminShell />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:userId" element={<UserDetailPage />} />
        <Route path="groups" element={<GroupsPage />} />
        <Route path="groups/:groupId" element={<GroupDetailPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="printers" element={<PrintersPage />} />
        <Route path="printers/:printerId" element={<PrinterDetailPage />} />
        <Route path="queues" element={<QueuesPage />} />
        <Route path="queues/:queueId" element={<QueueDetailPage />} />
        <Route path="devices" element={<DevicesPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="options" element={<OptionsPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
