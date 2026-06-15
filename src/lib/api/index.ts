/**
 * MediHub HTTP API — split by domain for easier navigation.
 * Import from `@/lib/api` (unchanged for the rest of the app).
 */

export { medihubFetch, parseJsonSafe, unwrapData, formatApiFailure } from "./client";

export { userFacingError, sanitizeUserFacingMessage } from "@/lib/userMessages";

export { isServerConfigured, buildOAuthStartUrl } from "./server";

export {
  registerAccount,
  loginWithPassword,
  logout,
  refreshAuthToken,
} from "./auth";

export {
  fetchCurrentUser,
  patchCurrentUserProfile,
  patchCurrentUserPhoto,
  patchCurrentUserPassword,
  normalizeUser,
  type UserProfilePatchPayload,
} from "./users";

export {
  fetchDoctorMe,
  createDoctorProfile,
  updateDoctorProfile,
  addDoctorDocuments,
  fetchPublicDoctors,
  type DoctorProfileCreatePayload,
  type DoctorProfileUpdatePayload,
} from "./doctors";

export { fetchAdminPendingDoctors, verifyAdminDoctor } from "./admin";

export { fetchBmiBuddyInfo, calculateBmi } from "./bmi";

export { fetchNearbyHospitals, type FetchNearbyHospitalsParams } from "./hospital-locator";

export { fetchReviews, createReview, submitContactQuery } from "./feedback";

export {
  listAiChats,
  getAiChat,
  createAiChat,
  sendAiChatMessage,
  sendAiChatMessageWithAttachments,
  deleteAiChat,
  renameAiChat,
} from "./ai-chat";

export {
  createAppointmentSlots,
  createAppointmentSlotsForDoctor,
  fetchDoctorSlots,
  fetchMyAppointments,
  fetchAdminAppointments,
  fetchPublicAppointmentsForAnalytics,
  bookAppointment,
  fetchAppointmentById,
  uploadPatientAppointmentReports,
  updatePatientAppointmentSymptoms,
  updateDoctorAppointmentNotes,
  uploadDoctorAppointmentFiles,
  deleteDoctorAppointmentFile,
  generateAppointmentAiDraft,
  approveAppointmentPrescription,
  cancelAppointmentByDoctor,
  restoreAppointmentByDoctor,
  fetchAppointmentNotifications,
  type CreateSlotsResult,
} from "./appointments";
