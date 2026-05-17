import { verifyAdminDoctor, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import { formatConsultationFee } from "@/lib/appointments";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { DoctorQualificationDocument, PendingDoctorProfile } from "@/types/admin";
import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Star,
  Stethoscope,
  XCircle,
} from "lucide-react";
import { useId, useState } from "react";

function doctorDisplayName(profile: PendingDoctorProfile): string {
  const u = profile.user;
  const n = [u?.firstName, u?.lastName].filter(Boolean).join(" ").trim();
  return n || u?.email || "Doctor";
}

interface PendingDoctorCardProps {
  profile: PendingDoctorProfile;
  onVerified: () => void;
}

export function PendingDoctorCard({ profile, onVerified }: PendingDoctorCardProps) {
  const rejectId = useId();
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(() => new Set(profile.documents.map((d) => d._id)));
  const [isRecommended, setIsRecommended] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [busy, setBusy] = useState<"verify" | "reject" | null>(null);

  const photo = resolveMediaUrl(profile.user?.photo);
  const name = doctorDisplayName(profile);

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function submit(status: "verified" | "rejected") {
    if (status === "rejected" && !rejectionReason.trim()) {
      notifyError("Add a short rejection reason for the doctor.");
      return;
    }
    const docIds = [...selectedDocIds];
    if (status === "verified" && profile.documents.length > 0 && docIds.length === 0) {
      notifyError("Select at least one document to verify.");
      return;
    }
    setBusy(status === "verified" ? "verify" : "reject");
    try {
      await verifyAdminDoctor(profile._id, {
        verificationStatus: status,
        documentIds: docIds.length > 0 ? docIds : undefined,
        rejectionReason: status === "rejected" ? rejectionReason : undefined,
        isRecommended: status === "verified" ? isRecommended : undefined,
      });
      notifySuccess(status === "verified" ? "Doctor verified successfully." : "Doctor rejected.");
      onVerified();
    } catch (e) {
      notifyError(userFacingError(e, "Action failed."));
    } finally {
      setBusy(null);
    }
  }

  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase()
      : (parts[0]?.slice(0, 2) ?? "DR").toUpperCase();

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:flex-row sm:items-start sm:gap-5 sm:px-6">
        {photo ? (
          <img src={photo} alt="" className="h-16 w-16 shrink-0 rounded-2xl border border-slate-200 object-cover" />
        ) : (
          <DoctorAvatarPlaceholder initials={initials} />
        )}
        <DoctorHeaderText profile={profile} name={name} />
      </header>

      <dl className="grid gap-3 border-b border-slate-100 px-5 py-4 text-sm sm:grid-cols-2 sm:px-6">
        <div>
          <dt className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">
            <Building2 className="h-3.5 w-3.5" aria-hidden />
            Hospital
          </dt>
          <dd className="mt-0.5 font-medium text-slate-900">{profile.hospitalName}</dd>
        </div>
        <DetailField label="Experience" value={`${profile.experienceYears} years`} />
        <DetailField label="Consultation fee" value={formatConsultationFee(profile.consultationFee)} />
        {profile.availabilitySchedule ? (
          <DetailField label="Schedule" value={profile.availabilitySchedule} className="sm:col-span-2" />
        ) : null}
      </dl>

      {profile.documents.length > 0 ? (
        <section className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h3 className="text-sm font-semibold text-slate-900">Qualification documents</h3>
          <p className="mt-1 text-xs text-slate-500">Select documents included in this verification decision.</p>
          <ul className="mt-3 flex flex-col gap-2">
            {profile.documents.map((doc) => (
              <DocumentRow
                key={doc._id}
                doc={doc}
                checked={selectedDocIds.has(doc._id)}
                onToggle={() => toggleDoc(doc._id)}
              />
            ))}
          </ul>
        </section>
      ) : (
        <p className="border-b border-slate-100 px-5 py-4 text-sm text-slate-600 sm:px-6">
          No qualification files were attached to this profile.
        </p>
      )}

      <section className="px-5 py-4 sm:px-6">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
            checked={isRecommended}
            onChange={(e) => setIsRecommended(e.target.checked)}
          />
          <Star className="h-4 w-4 text-amber-500" aria-hidden />
          Mark as recommended on the public directory
        </label>

        {showRejectForm ? (
          <div className="mt-4">
            <label htmlFor={rejectId} className="text-sm font-medium text-slate-800">
              Rejection reason
            </label>
            <textarea
              id={rejectId}
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain what needs to be corrected…"
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/20"
            />
            <button
              type="button"
              onClick={() => {
                setShowRejectForm(false);
                setRejectionReason("");
              }}
              className="mt-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
          </div>
        ) : null}

        <VerifyActions
          busy={busy}
          showRejectForm={showRejectForm}
          onVerify={() => void submit("verified")}
          onShowReject={() => setShowRejectForm(true)}
          onConfirmReject={() => void submit("rejected")}
        />
      </section>
    </article>
  );
}

function DoctorAvatarPlaceholder({ initials }: { initials: string }) {
  return (
    <div
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-teal-100 bg-teal-50 text-lg font-semibold text-teal-800"
      aria-hidden
    >
      {initials}
    </div>
  );
}

function DoctorHeaderText({ profile, name }: { profile: PendingDoctorProfile; name: string }) {
  return (
    <div className="min-w-0 flex-1">
      <h2 className="text-lg font-semibold text-slate-900">{name}</h2>
      <p className="mt-0.5 flex items-center gap-1.5 text-sm text-teal-700">
        <Stethoscope className="h-4 w-4 shrink-0" aria-hidden />
        {profile.specialization}
      </p>
      {profile.user?.email ? <p className="mt-1 text-sm text-slate-600">{profile.user.email}</p> : null}
      {profile.verificationStatus ? (
        <span className="mt-2 inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
          {profile.verificationStatus}
        </span>
      ) : null}
    </div>
  );
}

function DetailField({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function DocumentRow({
  doc,
  checked,
  onToggle,
}: {
  doc: DoctorQualificationDocument;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 transition hover:border-teal-200">
        <input
          type="checkbox"
          className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
          checked={checked}
          onChange={onToggle}
        />
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
            <FileText className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
            {doc.title}
          </span>
          {doc.verificationStatus ? (
            <span className="mt-0.5 block text-xs text-slate-500">Status: {doc.verificationStatus}</span>
          ) : null}
        </div>
        {doc.url ? (
          <a
            href={resolveMediaUrl(doc.url) ?? doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
            onClick={(e) => e.stopPropagation()}
          >
            View
            <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
      </label>
    </li>
  );
}

function VerifyActions({
  busy,
  showRejectForm,
  onVerify,
  onShowReject,
  onConfirmReject,
}: {
  busy: "verify" | "reject" | null;
  showRejectForm: boolean;
  onVerify: () => void;
  onShowReject: () => void;
  onConfirmReject: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={onVerify}
        className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
      >
        {busy === "verify" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CheckCircle2 className="h-4 w-4" aria-hidden />}
        Verify doctor
      </button>
      {!showRejectForm ? (
        <button
          type="button"
          disabled={busy !== null}
          onClick={onShowReject}
          className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
        >
          <XCircle className="h-4 w-4" aria-hidden />
          Reject
        </button>
      ) : (
        <button
          type="button"
          disabled={busy !== null}
          onClick={onConfirmReject}
          className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
        >
          {busy === "reject" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
          Confirm rejection
        </button>
      )}
    </div>
  );
}
