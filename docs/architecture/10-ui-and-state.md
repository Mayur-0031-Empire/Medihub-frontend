# 10. UI components and state

## 10.1 Component organization principles

1. **Feature folders** over generic `ui/` — components colocate with domain (`doctor/`, `appointments/`).
2. **Pages own data loading** — components receive props/callbacks.
3. **No shared design system package** — repeated patterns (cards, buttons) copy Tailwind classes.
4. **Accessibility** — focus rings on nav (`focus-visible:ring-teal-500`), `aria-label` on icon-only controls.

## 10.2 Layout and chrome

### `RootLayout`

Public site wrapper: `PublicNavbar`, `PublicFooter`, `DocumentTitle`. Navbar/footer omitted on `/splash`.

### `DashboardLayout`

- Sticky header: hamburger (mobile), logo, role label, notification bells, settings gear, sign out.
- **Left sidebar** on `lg+`; mobile **hamburger** opens left `Sheet` with full navigation.
- Settings footer link + `SettingsSheet` (theme: light / dark / auto; accessibility toggles).
- Main content: scrollable `<Outlet />` to the right of the sidebar.
- Loading and auth error states handled internally.

### `Logo` / `LoginHeroDoctor`

Brand identity; doctor login marketing illustration.

## 10.3 Auth UI

| Component | Role |
|-----------|------|
| `PortalRolePicker` | Choose patient/doctor/admin before register |
| `RegisterRoleRadio` | Role selection in forms |
| `RegisterAccountSections` | Shared name/email/password/photo fields |
| `SocialAuthButtons` | OAuth redirect buttons |
| `AuthTokenRefresh` | Invisible refresh scheduler |

## 10.4 Appointments UI

| Component | Used on |
|-----------|---------|
| `BookAppointmentPanel` | Patient booking, emergency flow |
| `DoctorCard` / `DoctorFiltersPanel` | Doctor discovery |
| `DoctorAvatar` | List thumbnails |
| `AppointmentHistoryList` | Past visits |
| `AppointmentFileList` | Report/file display |

## 10.5 Doctor workspace UI

| Component | Role |
|-----------|------|
| `DoctorAppointmentList` | Filterable visit list |
| `DoctorConsultClinicalPanel` | Notes, transcript, AI draft, approve Rx |
| `DoctorConsultPatientReports` | Uploaded files list |
| `MedicalScanViewer` | Image viewer + AI analyze |
| `DocumentVitalsIntake` | Vitals form + extract from PDF |
| `DoctorProfessionalProfileFields` | Profile form fields |
| `DoctorCancelledAppointmentsSection` | Restore cancelled visits |
| `DoctorNotificationBell` | Header dropdown + unread badge |

## 10.6 Consult UI

| Component | Role |
|-----------|------|
| `VideoConsultRoom` | Video + controls |
| `ConsultMedicalUpload` | Patient file upload during consult |
| `ConsultPatientSidebar` | Patient consult layout column |
| `PatientConsultPrescriptionCard` | Read-only prescription display |

## 10.7 Admin UI

| Component | Role |
|-----------|------|
| `PendingDoctorCard` | Verify/reject doctor documents |
| `AdminAppointmentList` | Admin view of bookings |

## 10.8 Public / guest UI

| Component | Role |
|-----------|------|
| `HomeNetworkDashboard` | Six date-filtered charts on home (`/`) |
| `ChartDateFilter` | Per-chart period presets (today, 7/30/90 days, custom) |
| `HomeBmiBuddyPanel` | BMI on `/features/bmi-buddy` |
| `HomeHospitalLocatorPanel` | Teaser / embed locator |
| `GuestAiChatPanel` | Marketing AI demo (if API allows guest — check implementation) |

## 10.9 Hospital locator UI

| Component | Role |
|-----------|------|
| `HospitalLocatorExperience` | Orchestrates geolocation + API fetch |
| `HospitalLocatorMap` | Leaflet map |
| `HospitalLocatorCard` | Hospital list item |
| `HospitalAnalyticsDashboard` | Charts for search results |

## 10.10 Charts

| Component | Data source |
|-----------|-------------|
| `ChartPanel` | Wrapper with title |
| `AnalyticsPieChart` | `ChartDatum[]` |
| `AnalyticsBarChart` | `ChartDatum[]` |
| `DoctorDashboardCharts` | `appointmentAnalytics.ts` |
| `AdminDashboardCharts` | `appointmentAnalytics.ts` |

Charts use SVG/CSS — not Chart.js/Recharts.

## 10.11 Dashboard state patterns

### Outlet context (primary shared state)

```ts
type DashboardOutletContext = {
  user: User;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
};
```

Consumed via `useOutletContext<DashboardOutletContext>()` in child routes.

**When to use:**

- Profile pages after PATCH user.
- Any page needing `user.role` without refetching layout.

### Local page state

Typical pattern:

```ts
const [items, setItems] = useState<PatientAppointment[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      const data = await fetchMyAppointments();
      if (!cancelled) setItems(data);
    } catch (e) {
      if (!cancelled) setError(userFacingError(e));
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();
  return () => { cancelled = true; };
}, []);
```

### Consult state

- Video hook holds refs (streams, PC) — not React state for media tracks.
- Transcript and notes: React state + debounced/interval PATCH.
- Poll merges remote appointment into local detail state.

## 10.12 Styling conventions

- **Primary brand:** teal (`teal-600`, `teal-700`).
- **Neutrals:** slate scale for text/backgrounds.
- **Cards:** `rounded-xl`, `border`, `shadow-sm`, white background.
- **Responsive:** `sm:`, `lg:` breakpoints; sidebar moves below main on small screens in dashboard.

## 10.13 Icons

All from `lucide-react` — consistent `h-4 w-4` or `h-5 w-5` in nav.
