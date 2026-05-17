import { SERVICE_UNAVAILABLE } from "@/lib/userMessages";

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/**
 * When true, API `fetch` calls use same-origin paths (`/api/...`) so HttpOnly cookies with
 * `SameSite=Strict` work in local dev (see Vite proxy in `vite.config.ts`).
 * Keep `VITE_MEDIHUB_SERVER` set to the real backend URL for OAuth redirects.
 */
export function sameOriginApiEnabled(): boolean {
  const v = import.meta.env.VITE_MEDIHUB_SAME_ORIGIN;
  return v === "true" || v === "1";
}

/**
 * Public backend origin (no trailing slash), e.g. https://api.example.com — from `VITE_MEDIHUB_SERVER`.
 * Used for OAuth start URLs and must stay set even when `sameOriginApiEnabled()` is true.
 */
export function getMedihubServer(): string {
  const raw = import.meta.env.VITE_MEDIHUB_SERVER;
  if (!raw || raw === "undefined") {
    return "";
  }
  return trimTrailingSlash(String(raw).trim());
}

/** Base URL prefix for `fetch`: empty string (same-origin `/api`) or full `VITE_MEDIHUB_SERVER`. */
export function getMedihubFetchBase(): string {
  return sameOriginApiEnabled() ? "" : getMedihubServer();
}

/**
 * Socket.IO server URL.
 * - Same-origin proxy (`VITE_MEDIHUB_SAME_ORIGIN`): browser origin so HttpOnly auth cookies reach `/socket.io`.
 * - Split deploy: `VITE_MEDIHUB_SERVER` (requires Bearer token in Socket.IO `auth`).
 */
export function getMedihubSocketUrl(): string {
  if (sameOriginApiEnabled() && typeof window !== "undefined") {
    return window.location.origin;
  }
  const server = getMedihubServer();
  return server || (typeof window !== "undefined" ? window.location.origin : "");
}

/** Video consult can authenticate with cookies when API + Socket.IO share the page origin. */
export function consultationSocketUsesCookieAuth(): boolean {
  return sameOriginApiEnabled() && typeof window !== "undefined";
}

/**
 * Socket URL for video consult — throws a clear error if `VITE_MEDIHUB_SERVER` is missing in dev.
 */
export function resolveConsultationSocketUrl(): string {
  const server = getMedihubServer();
  const url = getMedihubSocketUrl();

  if (!url) {
    throw new Error(
      "Video consult is not configured. Add VITE_MEDIHUB_SERVER to .env (your MediHub API URL, e.g. https://your-app.onrender.com).",
    );
  }

  if (import.meta.env.DEV && typeof window !== "undefined" && !server) {
    throw new Error(
      "VITE_MEDIHUB_SERVER is missing. Add it to .env — it must be your API host, not the Vite dev port (localhost:3000).",
    );
  }

  return url;
}

export function assertMedihubServerConfigured(): string {
  const origin = getMedihubServer();
  if (!origin) {
    throw new Error(SERVICE_UNAVAILABLE);
  }
  return getMedihubFetchBase();
}

/** Absolute backend origin for OAuth (always the real API host, not the dev proxy). */
export function assertMedihubServerOrigin(): string {
  const origin = getMedihubServer();
  if (!origin) {
    throw new Error(SERVICE_UNAVAILABLE);
  }
  return origin;
}

/** POST multipart register — must match your backend (default matches MediHub README). */
export function authPathRegister(): string {
  return import.meta.env.VITE_AUTH_REGISTER_PATH ?? "/api/auth/register";
}

/** POST JSON login */
export function authPathLogin(): string {
  return import.meta.env.VITE_AUTH_LOGIN_PATH ?? "/api/auth/login";
}

/** POST logout */
export function authPathLogout(): string {
  return import.meta.env.VITE_AUTH_LOGOUT_PATH ?? "/api/auth/logout";
}

/** POST refresh access token */
export function authPathRefresh(): string {
  return import.meta.env.VITE_AUTH_REFRESH_PATH ?? "/api/auth/refresh";
}

/** GET current user profile */
export function userPathMe(): string {
  return import.meta.env.VITE_USER_ME_PATH ?? "/api/users/me";
}

/** PATCH profile photo (multipart `photo`) */
export function userPathMePhoto(): string {
  return import.meta.env.VITE_USER_ME_PHOTO_PATH ?? "/api/users/me/photo";
}

/** PATCH change password (JSON body) */
export function userPathMePassword(): string {
  return import.meta.env.VITE_USER_ME_PASSWORD_PATH ?? "/api/users/me/password";
}

/** GET / POST / PATCH logged-in doctor profile (default matches MediHub README). */
export function doctorPathMe(): string {
  return import.meta.env.VITE_DOCTOR_ME_PATH ?? "/api/doctors/me";
}

/** POST additional qualification documents (`POST /api/doctors/me/documents`). */
export function doctorPathMeDocuments(): string {
  return import.meta.env.VITE_DOCTOR_ME_DOCUMENTS_PATH ?? "/api/doctors/me/documents";
}

/** GET pending doctors (admin). */
export function doctorAdminPendingPath(): string {
  return import.meta.env.VITE_DOCTOR_ADMIN_PENDING_PATH ?? "/api/doctors/admin/pending";
}

export function doctorAdminVerifyPath(doctorProfileId: string): string {
  const template =
    import.meta.env.VITE_DOCTOR_ADMIN_VERIFY_PATH ?? "/api/doctors/admin/:doctorProfileId/verify";
  return template.replace(":doctorProfileId", encodeURIComponent(doctorProfileId));
}

export function authPathGoogle(): string {
  return import.meta.env.VITE_AUTH_GOOGLE_PATH ?? "/api/auth/google";
}

export function authPathApple(): string {
  return import.meta.env.VITE_AUTH_APPLE_PATH ?? "/api/auth/apple";
}

export function authPathMicrosoft(): string {
  return import.meta.env.VITE_AUTH_MICROSOFT_PATH ?? "/api/auth/microsoft";
}

export function bmiBuddyInfoPath(): string {
  return import.meta.env.VITE_BMI_BUDDY_PATH ?? "/api/bmi-buddy";
}

export function bmiBuddyCalculatePath(): string {
  return import.meta.env.VITE_BMI_BUDDY_CALCULATE_PATH ?? "/api/bmi-buddy/calculate";
}

/** `GET/POST /api/ai/chats` — collection (README AI Chat APIs). */
export function aiChatsCollectionPath(): string {
  return (import.meta.env.VITE_AI_CHATS_PATH ?? "/api/ai/chats").replace(/\/+$/, "");
}

export function aiChatsMessagesAggregatePath(): string {
  return `${aiChatsCollectionPath()}/messages`;
}

export function aiChatByIdPath(chatId: string): string {
  return `${aiChatsCollectionPath()}/${encodeURIComponent(chatId)}`;
}

export function aiChatMessagesPath(chatId: string): string {
  return `${aiChatByIdPath(chatId)}/messages`;
}

/** Public verified doctors list (`GET /api/doctors`). */
export function doctorsPublicPath(): string {
  return import.meta.env.VITE_DOCTORS_PUBLIC_PATH ?? "/api/doctors";
}

/** Patient/doctor appointment list (`GET /api/appointments/me`). */
export function appointmentsMePath(): string {
  return import.meta.env.VITE_APPOINTMENTS_ME_PATH ?? "/api/appointments/me";
}

/** Admin: all platform bookings (`GET /api/appointments/admin` or override). */
export function appointmentsAdminListPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_ADMIN_LIST_PATH ?? "/api/appointments/admin";
}

/** Fallback list of all appointments when admin route differs. */
export function appointmentsAllListPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_ALL_LIST_PATH ?? "/api/appointments";
}

/** Book appointment (`POST /api/appointments/book`). */
export function appointmentsBookPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_BOOK_PATH ?? "/api/appointments/book";
}

/** Create availability slots (`POST /api/appointments/slots`) — logged-in verified doctor. */
export function appointmentsSlotsPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_SLOTS_PATH ?? "/api/appointments/slots";
}

/**
 * Admin creates slots for a doctor (`:doctorProfileId` optional placeholder).
 * Override with `VITE_APPOINTMENTS_ADMIN_SLOTS_PATH`, e.g.
 * `/api/appointments/admin/slots` or `/api/appointments/admin/:doctorProfileId/slots`.
 */
export function appointmentsAdminSlotsPath(doctorProfileId: string): string {
  const template =
    import.meta.env.VITE_APPOINTMENTS_ADMIN_SLOTS_PATH ??
    "/api/appointments/admin/:doctorProfileId/slots";
  return template.replace(":doctorProfileId", encodeURIComponent(doctorProfileId));
}

/** Bulk admin path when the API uses one URL + `doctorProfileId` in the JSON body. */
export function appointmentsAdminSlotsBulkPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_ADMIN_SLOTS_BULK_PATH ?? "/api/appointments/admin/slots";
}

/** Available slots for a doctor profile. */
export function doctorSlotsPath(doctorProfileId: string): string {
  const base =
    import.meta.env.VITE_APPOINTMENTS_DOCTOR_SLOTS_PATH ??
    "/api/appointments/doctors/:doctorProfileId/slots";
  return base.replace(":doctorProfileId", encodeURIComponent(doctorProfileId));
}

export function appointmentByIdPath(appointmentId: string): string {
  const base = import.meta.env.VITE_APPOINTMENT_BY_ID_PATH ?? "/api/appointments/:appointmentId";
  return base.replace(":appointmentId", encodeURIComponent(appointmentId));
}

export function appointmentDoctorNotesPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/doctor-notes`;
}

export function appointmentDoctorFilesPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/doctor-files`;
}

/** DELETE one doctor file (`:fileId` optional placeholder). */
export function appointmentDoctorFileDeletePath(appointmentId: string, fileId?: string): string {
  const template =
    import.meta.env.VITE_APPOINTMENT_DOCTOR_FILE_DELETE_PATH ??
    "/api/appointments/:appointmentId/doctor-files/:fileId";
  const withAppt = template.replace(":appointmentId", encodeURIComponent(appointmentId));
  if (!fileId || !withAppt.includes(":fileId")) return withAppt.replace("/:fileId", "").replace(":fileId", "");
  return withAppt.replace(":fileId", encodeURIComponent(fileId));
}

export function appointmentPatientReportsPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/reports`;
}

export function appointmentPatientSymptomsPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/symptoms`;
}

export function appointmentAiDraftPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/ai-draft`;
}

export function appointmentPrescriptionApprovePath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/prescription/approve`;
}

export function appointmentCancelByDoctorPath(appointmentId: string): string {
  return `${appointmentByIdPath(appointmentId)}/cancel-by-doctor`;
}

export function appointmentRestoreByDoctorPath(appointmentId: string): string {
  return (
    import.meta.env.VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH?.replace(":appointmentId", appointmentId) ??
    `${appointmentByIdPath(appointmentId)}/restore-by-doctor`
  );
}

export function appointmentNotificationsPath(): string {
  return import.meta.env.VITE_APPOINTMENTS_NOTIFICATIONS_PATH ?? "/api/appointments/notifications";
}

export function hospitalLocatorNearbyPath(): string {
  return import.meta.env.VITE_HOSPITAL_LOCATOR_NEARBY_PATH ?? "/api/hospital-locator/nearby";
}
