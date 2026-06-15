import { createReview, fetchPublicDoctors, fetchReviews, userFacingError } from "@/lib/api";
import { notifyError, notifySuccess } from "@/lib/notify";
import type { PublicDoctorProfile } from "@/types/appointment";
import type { PublicReview } from "@/types/feedback";
import { ChevronLeft, ChevronRight, Search, Star } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

function doctorName(review: PublicReview): string {
  const d = review.doctor;
  return [d?.firstName, d?.lastName].filter(Boolean).join(" ").trim() || d?.username || "MediHub doctor";
}

function cardTitle(review: PublicReview): string {
  return review.hospitalName || review.doctorProfile?.hospitalName || doctorName(review);
}

function patientName(review: PublicReview): string {
  return review.patient?.firstName || review.patient?.username || "Patient";
}

function ReviewCard({ review, onPause }: { review: PublicReview; onPause: () => void }) {
  return (
    <button
      type="button"
      onClick={onPause}
      className="w-80 shrink-0 rounded-2xl border border-white/70 bg-white/80 p-5 text-left shadow-xl shadow-slate-300/50 backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-black/30"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900 dark:text-white">{cardTitle(review)}</h3>
          <p className="text-xs text-slate-500">{doctorName(review)}</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700 ring-1 ring-amber-200">
          <Star className="h-3.5 w-3.5 fill-current" />
          {review.rating}
        </span>
      </div>
      <p className="mt-4 line-clamp-5 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{review.content}</p>
      <p className="mt-5 text-right text-xs font-semibold text-teal-700 dark:text-teal-300">- {patientName(review)}</p>
    </button>
  );
}

export function ReviewsPage() {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [doctors, setDoctors] = useState<PublicDoctorProfile[]>([]);
  const [search, setSearch] = useState("");
  const [paused, setPaused] = useState(false);
  const [doctorProfileId, setDoctorProfileId] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const reviewRows = await fetchReviews(search);
      setReviews(reviewRows);
    } catch (e) {
      notifyError(userFacingError(e, "Could not load reviews."));
    }

    try {
      const doctorRows = await fetchPublicDoctors();
      setDoctors(doctorRows);
    } catch (e) {
      notifyError(userFacingError(e, "Could not load doctors for the review form."));
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayReviews = useMemo(() => {
    const base = reviews.length ? reviews : [];
    return Array.from({ length: Math.max(15, base.length) }, (_, i) => base[i % Math.max(base.length, 1)]).filter(Boolean);
  }, [reviews]);

  function pauseForRead() {
    setPaused(true);
    window.setTimeout(() => setPaused(false), 30_000);
  }

  function moveReviews(direction: "left" | "right") {
    setPaused(true);
    const amount = 340 * (direction === "left" ? -1 : 1);
    trackRef.current?.scrollBy({ left: amount, behavior: "smooth" });
    window.setTimeout(() => setPaused(false), 10_000);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createReview({ doctorProfileId: doctorProfileId || undefined, hospitalName, rating, content });
      setContent("");
      setHospitalName("");
      notifySuccess("Review submitted.");
      await load();
    } catch (err) {
      notifyError(userFacingError(err, "Sign in as a patient to submit a review."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="overflow-hidden bg-gradient-to-br from-teal-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <style>{`@keyframes reviewMarquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}`}</style>
      <section className="mx-auto max-w-6xl px-4 py-14 lg:px-8">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Reviews</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900 dark:text-white">Patient stories across MediHub</h1>
        <div className="mt-6 flex max-w-xl gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search doctor or hospital reviews"
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-3 text-sm shadow-sm outline-none focus:border-teal-500"
            />
          </div>
          <button type="button" onClick={() => void load()} className="rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </div>
      </section>

      <section className="relative py-4">
        {displayReviews.length ? (
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-teal-50 to-transparent dark:from-slate-950" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-slate-100 to-transparent dark:from-slate-950" />
            <button
              type="button"
              onClick={() => moveReviews("left")}
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
              aria-label="Move reviews left"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => moveReviews("right")}
              className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl bg-white/90 text-slate-700 shadow-lg ring-1 ring-slate-200 backdrop-blur hover:bg-white"
              aria-label="Move reviews right"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div ref={trackRef} className="overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                className="flex gap-5"
                style={{
                  width: "max-content",
                  animation: paused ? "none" : "reviewMarquee 55s linear infinite",
                }}
              >
                {[...displayReviews, ...displayReviews].map((review, index) => (
                  <ReviewCard key={`${review._id}-${index}`} review={review} onPause={pauseForRead} />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <p className="mx-auto max-w-3xl rounded-2xl border border-dashed border-slate-200 bg-white/70 px-6 py-10 text-center text-sm text-slate-600">
            Reviews will appear here as patients share feedback.
          </p>
        )}
      </section>

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-14 lg:grid-cols-[1fr_1.1fr] lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Share a review</h2>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Patients can rate a doctor or hospital after care. Your first name is shown publicly; your last name stays private.
          </p>
        </div>
        <form onSubmit={(e) => void onSubmit(e)} className="rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-xl shadow-slate-200/70 backdrop-blur dark:border-slate-700 dark:bg-slate-900">
          <div className="grid gap-3 sm:grid-cols-2">
            <select value={doctorProfileId} onChange={(e) => setDoctorProfileId(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
              <option value="">Select doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {[doctor.user?.firstName, doctor.user?.lastName].filter(Boolean).join(" ") || "Doctor"} - {doctor.hospitalName}
                </option>
              ))}
            </select>
            <input value={hospitalName} onChange={(e) => setHospitalName(e.target.value)} placeholder="Hospital name" className="rounded-xl border border-slate-200 px-3 py-3 text-sm" />
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm">
              {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n === 1 ? "" : "s"}</option>)}
            </select>
          </div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={5} placeholder="Write your review..." className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm" />
          <button disabled={submitting} className="mt-3 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
            {submitting ? "Submitting..." : "Submit review"}
          </button>
        </form>
      </section>
    </div>
  );
}
