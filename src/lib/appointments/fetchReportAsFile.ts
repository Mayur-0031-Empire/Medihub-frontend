import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { AppointmentFileRef } from "@/types/appointment";

function guessMimeFromName(name: string): string {
  const n = name.toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  if (n.endsWith(".webp")) return "image/webp";
  if (n.endsWith(".txt")) return "text/plain";
  return "application/octet-stream";
}

/** Download a patient/doctor report from the API for client-side parsing. */
export async function fetchReportAsFile(fileRef: AppointmentFileRef): Promise<File> {
  const url = resolveMediaUrl(fileRef.url);
  if (!url) throw new Error("File URL is not available.");
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Could not download file.");
  }
  const blob = await res.blob();
  const name = fileRef.name ?? fileRef.title ?? "report";
  const type = blob.type && blob.type !== "application/octet-stream" ? blob.type : guessMimeFromName(name);
  return new File([blob], name, { type });
}
