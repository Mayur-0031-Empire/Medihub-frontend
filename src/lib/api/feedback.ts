import { assertMedihubServerConfigured, feedbackContactPath, feedbackReviewsPath } from "@/lib/config";
import type { ContactPayload, CreateReviewPayload, PublicReview } from "@/types/feedback";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

function normalizeReview(row: unknown): PublicReview | null {
  if (!row || typeof row !== "object") return null;
  const r = row as Record<string, unknown>;
  const id = String(r._id ?? r.id ?? "");
  if (!id) return null;
  return {
    ...(r as PublicReview),
    _id: id,
    rating: Number(r.rating) || 5,
    content: String(r.content ?? ""),
  };
}

function extractRows(data: unknown): unknown[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    for (const key of ["reviews", "items", "rows", "data"]) {
      if (Array.isArray(o[key])) return o[key];
    }
  }
  return [];
}

export async function fetchReviews(search?: string): Promise<PublicReview[]> {
  const base = assertMedihubServerConfigured();
  const q = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const res = await medihubFetch(`${base}${feedbackReviewsPath()}${q}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(formatApiFailure(body, "Could not load reviews"));
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  return extractRows(raw.data).map(normalizeReview).filter(Boolean) as PublicReview[];
}

export async function createReview(payload: CreateReviewPayload): Promise<PublicReview> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${feedbackReviewsPath()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(formatApiFailure(body, "Could not submit review"));
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
  const review = normalizeReview(raw.data);
  if (!review) throw new Error("Unexpected review response.");
  return review;
}

export async function submitContactQuery(payload: ContactPayload): Promise<void> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${feedbackContactPath()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) throw new Error(formatApiFailure(body, "Could not submit contact query"));
  const raw = unwrapData<unknown>(body);
  if (!raw.ok) throw new Error(raw.message);
}
