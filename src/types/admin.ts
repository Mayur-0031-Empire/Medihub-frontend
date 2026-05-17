import type { PublicDoctorUser } from "@/types/appointment";

export interface DoctorQualificationDocument {
  _id: string;
  title: string;
  url?: string;
  verificationStatus?: string;
}

export interface PendingDoctorProfile {
  _id: string;
  specialization: string;
  experienceYears: number;
  hospitalName: string;
  consultationFee: number;
  availabilitySchedule?: string;
  verificationStatus?: string;
  user?: PublicDoctorUser;
  documents: DoctorQualificationDocument[];
}

export type DoctorVerificationStatus = "verified" | "rejected";

export interface VerifyDoctorPayload {
  verificationStatus: DoctorVerificationStatus;
  documentIds?: string[];
  rejectionReason?: string;
  isRecommended?: boolean;
}
