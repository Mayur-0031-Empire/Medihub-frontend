import * as pdfjs from "pdfjs-dist";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

const TEXT_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/csv",
  "text/html",
]);

export async function extractTextFromDocument(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (TEXT_TYPES.has(file.type) || name.endsWith(".txt") || name.endsWith(".csv")) {
    return file.text();
  }
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractTextFromPdf(file);
  }
  throw new Error(
    "Unsupported file type. Upload a PDF or plain text report (.pdf, .txt, .csv) for automatic vitals extraction.",
  );
}

async function extractTextFromPdf(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data }).promise;
  const parts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    parts.push(pageText);
  }
  return parts.join("\n");
}
