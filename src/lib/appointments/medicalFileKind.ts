export type MedicalFileKind = "image" | "pdf" | "text" | "dicom" | "other";

export function medicalFileKind(fileName: string, mimeType?: string): MedicalFileKind {
  const name = fileName.toLowerCase();
  const mime = (mimeType ?? "").toLowerCase();
  if (mime.startsWith("image/") || /\.(png|jpe?g|webp|gif|bmp)$/i.test(name)) return "image";
  if (mime === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (
    mime.startsWith("text/") ||
    name.endsWith(".txt") ||
    name.endsWith(".csv") ||
    mime === "application/csv"
  ) {
    return "text";
  }
  if (name.endsWith(".dcm") || mime.includes("dicom")) return "dicom";
  return "other";
}

export function isImagingFile(fileName: string, mimeType?: string): boolean {
  const kind = medicalFileKind(fileName, mimeType);
  return kind === "image" || kind === "dicom";
}

export function imagingLabelFromName(fileName: string): string {
  const n = fileName.toLowerCase();
  if (n.includes("mri") || n.includes("mr_")) return "MRI";
  if (n.includes("xray") || n.includes("x-ray") || n.includes("x_ray") || n.includes("cxr")) return "X-ray";
  if (n.includes("ct") || n.includes("cat")) return "CT";
  if (n.includes("ultrasound") || n.includes("usg")) return "Ultrasound";
  return "Medical image";
}
