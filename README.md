# Print Management System

Print Management System is a university-focused web application being built to replace PaperCut with an in-house solution. The project focuses on secure pull printing, quota control, printer and queue management, auditability, and admin visibility across the print workflow.

This milestone submission covers the front-end prototype built with React, TypeScript, Vite, and Tailwind CSS. The current prototype demonstrates the main user-facing and admin-facing flows using mock data while backend integration is still pending.

## Front-End Scope

The prototype currently includes:

- Standard user portal screens for dashboard, submit job, and print history
- Admin screens for dashboard, users, groups, printers, queues, devices, reports, options, logs, and about
- Technician screens for dashboard, users, printers, and alerts
- Interactive navigation, detail pages, filters, forms, tables, status indicators, and queue-management flows
- Responsive layouts for desktop and smaller screens

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Radix UI primitives

## Project Structure

```text
print-management-system/
├── frontend/          # React front-end application
├── docs/              # Architecture and database notes
├── SSO Test 1.py      # Temporary auth reference file
├── AGENTS.md          # Shared project memory
└── README.md
```

Inside `frontend/src/`, the code is organized feature-first:

- `app/` for app shell and routing
- `features/` for admin, portal, and technician modules
- `components/` for shared UI and composite components
- `lib/` for utilities and helpers
- `mocks/` for mock data stores

## Setup and Installation

### Prerequisites

- Node.js 20+ recommended
- npm 10+ recommended

### Run Locally

```bash
cd frontend
npm install
npm run dev
```

The development server will start with Vite and print a local URL in the terminal.

### Production Build

```bash
cd frontend
npm run build
```

### Linting

```bash
cd frontend
npm run lint
```

## Usage

After starting the front end, open the local Vite URL and use the available routes:

- `/sign-in`
- `/portal/dashboard`
- `/portal/submit-job`
- `/portal/history`
- `/admin/dashboard`
- `/admin/users`
- `/admin/groups`
- `/admin/printers`
- `/admin/queues`
- `/tech/dashboard`

The current milestone uses mock data to simulate user actions and interface behavior.

## Mock Authentication (Current)

The prototype currently uses a mock authentication layer designed to be replaced later with SSO/Active Directory.

- Session is stored in `localStorage` under `auth_user`
- Passwords are only used in the mock store and are not saved in session
- Login redirects by role:
	- `Administrator` -> `/admin/dashboard`
	- `Technician` -> `/tech/dashboard`
	- `Student` / `Faculty` -> `/portal/dashboard`

### Test Credentials

All mock users use password: `123456`

- `admin@university.edu` (Administrator)
- `tech@university.edu` (Technician)
- `student@university.edu` (Student)
- `faculty@university.edu` (Faculty)
- `suspended@university.edu` (Suspended account, login blocked)

## Portal User-Aware Mock Data

Portal pages now resolve profile and job history from the authenticated user.

- `Student` and `Faculty` users now see user-specific portal profile data
- Portal job lists are filtered by the logged-in portal user
- New submitted jobs are stored with the current portal user's id
- Printers and queues remain shared static mock data for this milestone

## Team Members and Roles

- `Mohammed Ammar Sohail` - `Backend + Embedded devices`
- `Ahmed Alnasser` - `Backend + Embedded Deviced / Responsibility`
- `Moaz Ahmed` - `Frontend + UI/UX Design`
- `Ayman Musalli` - `Frontend + UI/UX Design`

## Notes

- This repository currently focuses on the front-end milestone and prototype behavior.
- Backend integration, Active Directory setup, and real printer release flow are planned separately.
- Environment secrets and production credentials are not included in this repository.
