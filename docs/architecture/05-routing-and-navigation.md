# 5. Routing and navigation

Routing is defined in `src/app/App.tsx` using **React Router v7** (`BrowserRouter`, nested `Route`s).

## 5.1 Route tree

```txt
/  (RootLayout — PublicNavbar + PublicFooter; hidden on /splash)
├── /                          → HomePage (default) — network charts + feature cards
├── /home                        → HomePage (alias)
├── /splash                      → SplashPage (heart loader → / after ~2.8s)
├── /about                       → AboutPage (optional marketing)
├── /portals                     → PortalsPage (register by role)
├── /features/ai-assistant       → AiAssistantFeaturePage
├── /features/bmi-buddy          → BmiBuddyFeaturePage
├── /features/hospital-locator   → HospitalLocatorFeaturePage
├── /emergency                   → EmergencyAppointmentPage
├── /login                       → LoginPage
├── /register                    → RegisterEntryPage
├── /register/:role              → RegisterPage (patient | doctor | admin)
└── /auth/callback               → AuthCallbackPage

/dashboard  (DashboardLayout — requires session)
├── /dashboard                   → redirect to role home
├── /dashboard/patient           → patient home
├── /dashboard/patient/profile
├── /dashboard/patient/appointments
├── /dashboard/patient/appointments/:appointmentId
├── /dashboard/patient/consult/:appointmentId
├── /dashboard/patient/medical-records
├── /dashboard/doctor
├── /dashboard/doctor/appointments
├── /dashboard/doctor/appointments/:appointmentId
├── /dashboard/doctor/consult/:appointmentId
├── /dashboard/doctor/notifications
├── /dashboard/doctor/slots
├── /dashboard/doctor-profile    → DoctorProfilePage (professional profile)
├── /dashboard/admin
├── /dashboard/admin/pending-doctors
├── /dashboard/admin/appointments
├── /dashboard/admin/manage-slots
├── /dashboard/admin/profile
├── /dashboard/chatbot           → DashboardRoleGate [patient, admin]
├── /dashboard/bmi-buddy         → DashboardRoleGate [patient, admin]
├── /dashboard/bmi-buddy/results → DashboardRoleGate [patient, admin]
├── /dashboard/hospital-locator  → DashboardRoleGate [patient, admin]
├── /dashboard/patient-services  → DashboardRoleGate [patient] placeholder
└── /dashboard/*                 → Navigate to /dashboard

/*  (catch-all outside layouts)  → Navigate to /login
```

## 5.2 Layout components

### `RootLayout` (`components/layout/RootLayout.tsx`)

- Wraps **public** routes only.
- `PublicNavbar` + `PublicFooter` on all routes except `/splash` (full-screen loader).
- Settings gear opens `SettingsSheet` (theme + accessibility).
- No auth requirement.

### Public entry flow

| Step | Route | Behavior |
|------|-------|----------|
| Default | `/` | `HomePage` with `HomeNetworkDashboard` charts |
| Optional intro | `/splash` | Rotating heart animation, then **`/`** (homepage) |
| About | `/about` | Linked from navbar only; not part of splash exit |

### `DashboardLayout` (`components/layout/DashboardLayout.tsx`)

**Chrome:** **Left sidebar** on desktop; **hamburger** + left `Sheet` on mobile (full nav). Settings in sidebar footer.

**Auth gate behavior:**

1. On mount: `fetchCurrentUser()` from `@/lib/api`.
2. Loading: full-screen spinner.
3. Failure (not a connection/config error): redirect to `/login?returnTo=<encoded path>`.
4. Connection/config error: show message + link to login (no redirect loop).
5. Success: render header, sidebar, `<Outlet context={outletContext} />`.

**Role redirect:** If pathname is exactly `/dashboard`, `Navigate` to `dashboardHomePath(user.role)`.

### `DashboardRoleGate`

```tsx
<DashboardRoleGate allow={["patient", "admin"]}>
  <AiChatPage />
</DashboardRoleGate>
```

Reads `user` from outlet context. If `user.role` not in `allow`, redirects to that user's role home.

## 5.3 Navigation helpers

| Function | File | Behavior |
|----------|------|----------|
| `dashboardHomePath(role)` | `lib/dashboardPaths.ts` | `doctor` → `/dashboard/doctor`, `admin` → `/dashboard/admin`, else patient |
| `safeDashboardReturnTo(raw)` | `lib/dashboardPaths.ts` | Whitelist post-login redirect (only `/dashboard/*` or `/emergency`) |
| `registerPathForRole(role)` | `lib/auth/portalRole.ts` | `/register/patient` etc. |
| `portalFromSearchString(search)` | `lib/auth/portalRole.ts` | `?portal=doctor` for login UX |

## 5.4 Sidebar navigation by role

Defined in `lib/dashboard/sidebarItems.ts` and rendered via `DashboardSidebarNav`.

**Patient:** Home, Profile, BMI Buddy, Appointment booking, Notifications, Visit documents, My uploads, Chatbot, Hospital locator.

**Doctor:** Workspace, Professional profile, Manage slots, Appointments, Notifications (badge from `useDoctorNotifications`).

**Admin:** Admin home, Pending doctors, Manage slots, Bookings, Account profile, Hospital locator.

Doctors **do not** see BMI, chatbot, or hospital locator in sidebar (by design).

## 5.5 Global side effects on navigation

`AuthTokenRefresh` mounts at app root:

- Runs when pathname is `/dashboard/*` or Bearer token exists.
- Calls `POST /api/auth/refresh` every **15 minutes** (`AUTH_REFRESH_INTERVAL_MS`).
- Uses refresh **HttpOnly cookie** + updates Bearer in `sessionStorage` if returned.

## 5.6 Catch-all behavior

- Unknown paths under `/dashboard/*` → `/dashboard` (then role home).
- Any other unknown path → `/login`.

This means deep links to non-dashboard routes must be registered explicitly in `App.tsx`.

## 5.7 Route ↔ API quick map

| Route segment | Primary API modules |
|---------------|---------------------|
| `/login`, `/register` | `lib/api/auth.ts`, `lib/api/users.ts` |
| `/dashboard/patient/appointments` | `appointments.ts`, `doctors.ts` (public list) |
| `/dashboard/*/consult/:id` | `appointments.ts`, `socket/consultation.ts` |
| `/dashboard/chatbot` | `ai-chat.ts` |
| `/dashboard/bmi-buddy` | `bmi.ts` |
| `/dashboard/hospital-locator` | `hospital-locator.ts` |
| `/dashboard/admin/pending-doctors` | `admin.ts`, `doctors.ts` |
