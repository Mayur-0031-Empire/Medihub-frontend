import { AuthTokenRefresh } from "@/components/auth/AuthTokenRefresh";
import { Toaster } from "@/components/ui/sonner";
import { RootLayout } from "@/components/layout/RootLayout";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { DashboardRoleGate } from "@/components/layout/DashboardRoleGate";
import { AuthCallbackPage } from "@/pages/auth/AuthCallbackPage";
import { LoginPage } from "@/pages/auth/LoginPage";
import { RegisterEntryPage } from "@/pages/auth/RegisterEntryPage";
import { RegisterPage } from "@/pages/auth/RegisterPage";
import { AdminAppointmentsRoute } from "@/pages/dashboard/admin/AdminAppointmentsRoute";
import { AdminManageSlotsRoute } from "@/pages/dashboard/admin/AdminManageSlotsRoute";
import { AdminPendingDoctorsRoute } from "@/pages/dashboard/admin/AdminPendingDoctorsRoute";
import { AdminProfileRoute } from "@/pages/dashboard/admin/AdminProfileRoute";
import { DashboardAdminHomeRoute } from "@/pages/dashboard/admin/DashboardAdminHomeRoute";
import { DoctorAppointmentDetailRoute } from "@/pages/dashboard/doctor/DoctorAppointmentDetailRoute";
import { DoctorAppointmentsRoute } from "@/pages/dashboard/doctor/DoctorAppointmentsRoute";
import { DoctorConsultRoute } from "@/pages/dashboard/doctor/DoctorConsultRoute";
import { DoctorHomeRoute } from "@/pages/dashboard/doctor/DoctorHomeRoute";
import { DoctorManageSlotsRoute } from "@/pages/dashboard/doctor/DoctorManageSlotsRoute";
import { DoctorNotificationsRoute } from "@/pages/dashboard/doctor/DoctorNotificationsRoute";
import { DoctorProfilePage } from "@/pages/dashboard/doctor/DoctorProfilePage";
import { DashboardPatientHomeRoute } from "@/pages/dashboard/patient/DashboardPatientHomeRoute";
import { PatientAppointmentsPage } from "@/pages/dashboard/patient/PatientAppointmentsPage";
import { PatientAppointmentDetailRoute } from "@/pages/dashboard/patient/PatientAppointmentDetailRoute";
import { PatientConsultRoute } from "@/pages/dashboard/patient/PatientConsultRoute";
import { PatientMedicalRecordsRoute } from "@/pages/dashboard/patient/PatientMedicalRecordsRoute";
import { PatientNotificationsRoute } from "@/pages/dashboard/patient/PatientNotificationsRoute";
import { PatientVisitDocumentsRoute } from "@/pages/dashboard/patient/PatientVisitDocumentsRoute";
import { PatientProfileRoute } from "@/pages/dashboard/patient/PatientProfileRoute";
import { AiChatPage } from "@/pages/dashboard/shared/AiChatPage";
import { BmiBuddyResultsPage } from "@/pages/dashboard/shared/BmiBuddyResultsPage";
import { BmiBuddySetupPage } from "@/pages/dashboard/shared/BmiBuddySetupPage";
import { HospitalLocatorPage } from "@/pages/dashboard/shared/HospitalLocatorPage";
import { StressMonitorPage } from "@/pages/dashboard/shared/StressMonitorPage";
import { EmergencyAppointmentPage } from "@/pages/public/EmergencyAppointmentPage";
import { AboutPage } from "@/pages/public/AboutPage";
import { ContactPage } from "@/pages/public/ContactPage";
import { FaqPage } from "@/pages/public/FaqPage";
import { ReviewsPage } from "@/pages/public/ReviewsPage";
import { AiAssistantFeaturePage } from "@/pages/public/features/AiAssistantFeaturePage";
import { BmiBuddyFeaturePage } from "@/pages/public/features/BmiBuddyFeaturePage";
import { HospitalLocatorFeaturePage } from "@/pages/public/features/HospitalLocatorFeaturePage";
import { HomePage } from "@/pages/public/HomePage";
import { PortalsPage } from "@/pages/public/PortalsPage";
import { SplashPage } from "@/pages/public/SplashPage";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

export default function App() {
  return (
    <BrowserRouter>
      <AuthTokenRefresh />
      <Toaster />
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="splash" element={<SplashPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="questions" element={<FaqPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="home" element={<HomePage />} />
          <Route path="portals" element={<PortalsPage />} />
          <Route path="features/ai-assistant" element={<AiAssistantFeaturePage />} />
          <Route path="features/bmi-buddy" element={<BmiBuddyFeaturePage />} />
          <Route path="features/hospital-locator" element={<HospitalLocatorFeaturePage />} />
          <Route path="emergency" element={<EmergencyAppointmentPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register/:role" element={<RegisterPage />} />
          <Route path="register" element={<RegisterEntryPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
        </Route>

        <Route path="dashboard" element={<DashboardLayout />}>
          <Route path="patient" element={<DashboardPatientHomeRoute />} />
          <Route path="patient/profile" element={<PatientProfileRoute />} />
          <Route path="patient/appointments" element={<PatientAppointmentsPage />} />
          <Route path="patient/appointments/:appointmentId" element={<PatientAppointmentDetailRoute />} />
          <Route path="patient/consult/:appointmentId" element={<PatientConsultRoute />} />
          <Route path="patient/notifications" element={<PatientNotificationsRoute />} />
          <Route path="patient/documents" element={<PatientVisitDocumentsRoute />} />
          <Route path="patient/medical-records" element={<PatientMedicalRecordsRoute />} />
          <Route path="doctor" element={<DoctorHomeRoute />} />
          <Route path="doctor/appointments" element={<DoctorAppointmentsRoute />} />
          <Route path="doctor/appointments/:appointmentId" element={<DoctorAppointmentDetailRoute />} />
          <Route path="doctor/notifications" element={<DoctorNotificationsRoute />} />
          <Route path="doctor/consult/:appointmentId" element={<DoctorConsultRoute />} />
          <Route path="admin" element={<DashboardAdminHomeRoute />} />
          <Route path="admin/pending-doctors" element={<AdminPendingDoctorsRoute />} />
          <Route path="admin/appointments" element={<AdminAppointmentsRoute />} />
          <Route path="admin/manage-slots" element={<AdminManageSlotsRoute />} />
          <Route path="admin/profile" element={<AdminProfileRoute />} />
          <Route path="doctor/slots" element={<DoctorManageSlotsRoute />} />
          <Route path="doctor-profile" element={<DoctorProfilePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="questions" element={<FaqPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route
            path="chatbot"
            element={
              <DashboardRoleGate allow={["patient", "admin"]}>
                <AiChatPage />
              </DashboardRoleGate>
            }
          />
          <Route
            path="bmi-buddy"
            element={
              <DashboardRoleGate allow={["patient", "admin"]}>
                <BmiBuddySetupPage />
              </DashboardRoleGate>
            }
          />
          <Route
            path="bmi-buddy/results"
            element={
              <DashboardRoleGate allow={["patient", "admin"]}>
                <BmiBuddyResultsPage />
              </DashboardRoleGate>
            }
          />
          <Route
            path="hospital-locator"
            element={
              <DashboardRoleGate allow={["patient", "admin"]}>
                <HospitalLocatorPage />
              </DashboardRoleGate>
            }
          />
          <Route
            path="stress-monitor"
            element={
              <DashboardRoleGate allow={["patient", "doctor", "admin"]}>
                <StressMonitorPage />
              </DashboardRoleGate>
            }
          />
          <Route path="patient-services" element={<Navigate to="/dashboard/patient" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
