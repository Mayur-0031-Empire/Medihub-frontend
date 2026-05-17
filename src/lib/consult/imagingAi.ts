import { sendAiChatMessageWithAttachments } from "@/lib/api";
import { extractReplyFromPayload, latestAssistantReply } from "@/lib/ai/reply";
import { imagingLabelFromName, medicalFileKind } from "@/lib/appointments/medicalFileKind";

export type ImagingClinicalContext = {
  symptoms?: string;
  diagnosis?: string;
  patientNotes?: string;
};

function buildImagingAnalysisPrompt(imagingType: string, ctx?: ImagingClinicalContext): string {
  const lines = [
    `You are a clinical imaging assistant helping a licensed physician review a patient-uploaded ${imagingType} during a teleconsult.`,
    "",
    "IMPORTANT: Decision support only — not a definitive diagnosis. The physician must verify all findings clinically.",
    "",
  ];
  if (ctx?.symptoms?.trim()) lines.push(`Patient symptoms: ${ctx.symptoms.trim()}`);
  if (ctx?.diagnosis?.trim()) lines.push(`Working diagnosis (doctor): ${ctx.diagnosis.trim()}`);
  if (ctx?.patientNotes?.trim()) lines.push(`Patient notes: ${ctx.patientNotes.trim()}`);
  if (lines.length > 4) lines.push("");
  lines.push(
    "Analyze the attached image. Respond with concise bullet points covering:",
    "1. Study type / projection (if identifiable)",
    "2. Objective findings visible on the image",
    "3. Differential considerations (with uncertainty)",
    "4. Suggested follow-up or correlating tests",
    "5. Limitations of this review (quality, single view, non-diagnostic AI, etc.)",
  );
  return lines.join("\n");
}

/** Sends the scan image to MediHub AI Chat (vision via attachments) and returns the assistant summary. */
export async function analyzeMedicalScanWithAi(
  imageFile: File,
  options?: { fileName?: string; clinicalContext?: ImagingClinicalContext },
): Promise<string> {
  const name = options?.fileName ?? imageFile.name;
  const kind = medicalFileKind(name, imageFile.type);
  if (kind !== "image") {
    throw new Error("AI scan analysis requires a PNG, JPEG, or WebP image. Export DICOM to image or upload a snapshot.");
  }
  const imagingType = imagingLabelFromName(name);
  const prompt = buildImagingAnalysisPrompt(imagingType, options?.clinicalContext);
  const { thread, data } = await sendAiChatMessageWithAttachments(null, prompt, [imageFile]);
  const reply = latestAssistantReply(thread) ?? extractReplyFromPayload(data);
  if (!reply) {
    throw new Error(
      "AI did not return analysis text. Ensure vision/attachments are enabled on your MediHub server AI Chat API.",
    );
  }
  return reply;
}
