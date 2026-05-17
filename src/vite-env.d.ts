/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MEDIHUB_SERVER: string;
  /** When true, API calls use same-origin `/api` (Vite dev proxy); keep VITE_MEDIHUB_SERVER for OAuth. */
  readonly VITE_MEDIHUB_SAME_ORIGIN?: string;
  readonly VITE_AUTH_REGISTER_PATH?: string;
  readonly VITE_AUTH_LOGIN_PATH?: string;
  readonly VITE_AUTH_LOGOUT_PATH?: string;
  readonly VITE_AUTH_REFRESH_PATH?: string;
  readonly VITE_USER_ME_PATH?: string;
  readonly VITE_USER_ME_PHOTO_PATH?: string;
  readonly VITE_USER_ME_PASSWORD_PATH?: string;
  readonly VITE_DOCTOR_ME_PATH?: string;
  readonly VITE_DOCTOR_ME_DOCUMENTS_PATH?: string;
  readonly VITE_DOCTOR_ADMIN_PENDING_PATH?: string;
  readonly VITE_DOCTOR_ADMIN_VERIFY_PATH?: string;
  readonly VITE_AUTH_GOOGLE_PATH?: string;
  readonly VITE_AUTH_APPLE_PATH?: string;
  readonly VITE_AUTH_MICROSOFT_PATH?: string;
  readonly VITE_BMI_BUDDY_PATH?: string;
  readonly VITE_BMI_BUDDY_CALCULATE_PATH?: string;
  readonly VITE_AI_CHATS_PATH?: string;
  readonly VITE_DOCTORS_PUBLIC_PATH?: string;
  readonly VITE_APPOINTMENTS_ME_PATH?: string;
  readonly VITE_APPOINTMENTS_ADMIN_LIST_PATH?: string;
  readonly VITE_APPOINTMENTS_ALL_LIST_PATH?: string;
  readonly VITE_APPOINTMENTS_BOOK_PATH?: string;
  readonly VITE_APPOINTMENTS_SLOTS_PATH?: string;
  readonly VITE_APPOINTMENTS_ADMIN_SLOTS_PATH?: string;
  readonly VITE_APPOINTMENTS_ADMIN_SLOTS_BULK_PATH?: string;
  readonly VITE_APPOINTMENTS_DOCTOR_SLOTS_PATH?: string;
  readonly VITE_APPOINTMENT_BY_ID_PATH?: string;
  readonly VITE_APPOINTMENT_RESTORE_BY_DOCTOR_PATH?: string;
  readonly VITE_APPOINTMENTS_NOTIFICATIONS_PATH?: string;
  readonly VITE_OAUTH_REDIRECT_URL?: string;
  /** Optional HTTPS URL for a looping hero video on the home page (self-hosted recommended). */
  readonly VITE_HERO_VIDEO_URL?: string;
  /** Optional JSON array of RTCIceServer objects for WebRTC consult. */
  readonly VITE_WEBRTC_ICE_SERVERS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
