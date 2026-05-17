import type { AiMessage } from "@/types/aiChat";
import { analyzeTextSentiment } from "./chatSentiment";

export const MEDIHUB_CARE_APPOINTMENTS_PATH = "/dashboard/patient/appointments";

const CARE_ASSISTANT_MARKDOWN = `**We're here for you**

From what you shared, it sounds like you may be going through a hard time. If you'd like real support from a clinician, you can book an appointment and talk with a doctor.

[Book an appointment](${MEDIHUB_CARE_APPOINTMENTS_PATH})`;

/**
 * After each user message that scores negative (Latin AFINN), inserts a synthetic assistant
 * bubble with supportive copy and an in-app appointment link. Shown before the model's
 * reply when one follows, or alone when the user message is still last.
 */
export function mergeCareAssistantAfterNegativeUser(messages: AiMessage[]): AiMessage[] {
  const out: AiMessage[] = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    out.push(m);
    if (m.role !== "user") continue;
    const s = analyzeTextSentiment(m.content);
    if (s.kind !== "scored" || s.label !== "negative") continue;
    const next = messages[i + 1];
    if (next !== undefined && next.role !== "assistant") continue;
    const careId = `medihub-care-${m.id}`;
    if (messages.some((x) => x.id === careId) || out.some((x) => x.id === careId)) continue;
    out.push({
      id: careId,
      role: "assistant",
      content: CARE_ASSISTANT_MARKDOWN,
    });
  }
  return out;
}
