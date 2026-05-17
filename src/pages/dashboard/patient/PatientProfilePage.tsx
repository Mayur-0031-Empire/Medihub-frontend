import {
  patchCurrentUserPassword,
  patchCurrentUserPhoto,
  patchCurrentUserProfile,
  type UserProfilePatchPayload,
  userFacingError,
} from "@/lib/api";
import { Loader2, Lock, Mail, Save, User as UserIcon } from "lucide-react";
import { useEffect, useId, useState, type FormEvent } from "react";
import { useOutletContext } from "react-router-dom";
import type { DashboardOutletContext } from "../context/outletContext";

const inputBase =
  "w-full rounded-xl border border-slate-200 bg-slate-50/80 py-2.5 px-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-600/25 disabled:opacity-60";

export function PatientProfilePage() {
  const formId = useId();
  const { user, refreshUser } = useOutletContext<DashboardOutletContext>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [age, setAge] = useState("");

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [profileSaving, setProfileSaving] = useState(false);
  const [photoSaving, setPhotoSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
    setPhone(user.phone ?? "");
    setGender(user.gender ?? "");
    setAddress(user.address ?? "");
    setBloodGroup(user.bloodGroup ?? "");
    setAge(user.age !== undefined && user.age !== null ? String(user.age) : "");
  }, [user]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(null);
      return;
    }
    const url = URL.createObjectURL(photoFile);
    setPhotoPreview(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [photoFile]);

  async function onSaveProfile(e: FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const ageNum = age.trim() === "" ? undefined : Number.parseInt(age, 10);
    const payload: UserProfilePatchPayload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      gender: gender.trim(),
      address: address.trim(),
      bloodGroup: bloodGroup.trim(),
      age: ageNum !== undefined && !Number.isNaN(ageNum) ? ageNum : undefined,
    };
    setProfileSaving(true);
    try {
      await patchCurrentUserProfile(payload);
      await refreshUser();
      setProfileMessage("Profile updated.");
    } catch (err) {
      setProfileError(userFacingError(err, "Could not save profile."));
    } finally {
      setProfileSaving(false);
    }
  }

  async function onSavePhoto(e: FormEvent) {
    e.preventDefault();
    setPhotoError(null);
    if (!photoFile) {
      setPhotoError("Choose a photo file first.");
      return;
    }
    setPhotoSaving(true);
    try {
      await patchCurrentUserPhoto(photoFile);
      setPhotoFile(null);
      await refreshUser();
    } catch (err) {
      setPhotoError(userFacingError(err, "Could not update photo."));
    } finally {
      setPhotoSaving(false);
    }
  }

  async function onSavePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }
    if (!oldPassword || !newPassword) {
      setPasswordError("Fill in all password fields.");
      return;
    }
    setPasswordSaving(true);
    try {
      await patchCurrentUserPassword(oldPassword, newPassword, confirmPassword);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
      await refreshUser();
    } catch (err) {
      setPasswordError(userFacingError(err, "Could not update password."));
    } finally {
      setPasswordSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Your profile</h1>
        <p className="mt-2 text-sm text-slate-600">
          Update the details your care team sees. Email and username are managed by your account settings on the
          server.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-teal-50 to-white px-6 py-6 sm:flex sm:items-start sm:gap-6">
          <div className="mx-auto flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 text-slate-400 sm:mx-0">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="h-full w-full object-cover" />
            ) : user.photo ? (
              <img src={user.photo} alt="" className="h-full w-full object-cover" />
            ) : (
              <UserIcon className="h-12 w-12" strokeWidth={1.25} aria-hidden />
            )}
          </div>
          <div className="mt-4 min-w-0 flex-1 sm:mt-0">
            <h2 className="text-lg font-semibold text-slate-900">Profile photo</h2>
            <p className="mt-1 text-sm text-slate-600">JPEG, PNG, or WebP. Max 5 MB recommended.</p>
            <form onSubmit={onSavePhoto} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                <span className="sr-only">Choose photo</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-teal-900 hover:file:bg-teal-100"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
                />
              </label>
              <button
                type="submit"
                disabled={photoSaving || !photoFile}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {photoSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Update photo
              </button>
            </form>
            {photoError ? (
              <p className="mt-2 text-sm text-red-700" role="alert">
                {photoError}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold text-slate-900">Account details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2">
            <dt className="flex items-center gap-2 text-slate-500">
              <Mail className="h-4 w-4 shrink-0" aria-hidden />
              Email
            </dt>
            <dd className="font-medium text-slate-900">{user.email ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2">
            <dt className="text-slate-500">Username</dt>
            <dd className="font-medium text-slate-900">{user.username ?? "—"}</dd>
          </div>
          <div className="flex flex-wrap justify-between gap-2 py-2">
            <dt className="text-slate-500">Account ID</dt>
            <dd className="font-mono text-xs text-slate-700">{user._id}</dd>
          </div>
        </dl>

        <form id={`${formId}-profile`} onSubmit={onSaveProfile} className="mt-8 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-fn`} className="mb-1 block text-sm font-medium text-slate-700">
                First name
              </label>
              <input
                id={`${formId}-fn`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputBase}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor={`${formId}-ln`} className="mb-1 block text-sm font-medium text-slate-700">
                Last name
              </label>
              <input
                id={`${formId}-ln`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputBase}
                autoComplete="family-name"
              />
            </div>
          </div>
          <div>
            <label htmlFor={`${formId}-phone`} className="mb-1 block text-sm font-medium text-slate-700">
              Phone
            </label>
            <input
              id={`${formId}-phone`}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={inputBase}
              autoComplete="tel"
            />
          </div>
          <div>
            <label htmlFor={`${formId}-gender`} className="mb-1 block text-sm font-medium text-slate-700">
              Gender
            </label>
            <select id={`${formId}-gender`} value={gender} onChange={(e) => setGender(e.target.value)} className={inputBase}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label htmlFor={`${formId}-addr`} className="mb-1 block text-sm font-medium text-slate-700">
              Address
            </label>
            <textarea
              id={`${formId}-addr`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              className={`${inputBase} resize-y`}
              autoComplete="street-address"
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor={`${formId}-bg`} className="mb-1 block text-sm font-medium text-slate-700">
                Blood group
              </label>
              <input
                id={`${formId}-bg`}
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={inputBase}
                placeholder="e.g. O+"
                maxLength={8}
              />
            </div>
            <div>
              <label htmlFor={`${formId}-age`} className="mb-1 block text-sm font-medium text-slate-700">
                Age
              </label>
              <input
                id={`${formId}-age`}
                type="number"
                min={0}
                max={130}
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className={inputBase}
              />
            </div>
          </div>

          {profileError ? (
            <p className="text-sm text-red-700" role="alert">
              {profileError}
            </p>
          ) : null}
          {profileMessage ? (
            <p className="text-sm text-teal-800" role="status">
              {profileMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={profileSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {profileSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
            Save profile
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Lock className="h-5 w-5 text-slate-600" aria-hidden />
          Change password
        </h2>
        <form onSubmit={onSavePassword} className="mt-6 space-y-4">
          <div>
            <label htmlFor={`${formId}-old`} className="mb-1 block text-sm font-medium text-slate-700">
              Current password
            </label>
            <input
              id={`${formId}-old`}
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-new`} className="mb-1 block text-sm font-medium text-slate-700">
              New password
            </label>
            <input
              id={`${formId}-new`}
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={inputBase}
            />
          </div>
          <div>
            <label htmlFor={`${formId}-confirm`} className="mb-1 block text-sm font-medium text-slate-700">
              Confirm new password
            </label>
            <input
              id={`${formId}-confirm`}
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputBase}
            />
          </div>
          {passwordError ? (
            <p className="text-sm text-red-700" role="alert">
              {passwordError}
            </p>
          ) : null}
          {passwordSuccess ? (
            <p className="text-sm text-teal-800" role="status">
              {passwordSuccess}
            </p>
          ) : null}
          <button
            type="submit"
            disabled={passwordSaving}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {passwordSaving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            Update password
          </button>
        </form>
      </section>
    </div>
  );
}
