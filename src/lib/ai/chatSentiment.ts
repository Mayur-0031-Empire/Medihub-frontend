import Sentiment from "sentiment";

const analyzer = new Sentiment();

/** Letters from scripts where the bundled AFINN model is not used (avoid misleading scores). */
const REGIONAL_LETTER =
  /\p{Script=Devanagari}|\p{Script=Tamil}|\p{Script=Telugu}|\p{Script=Bengali}|\p{Script=Gujarati}|\p{Script=Kannada}|\p{Script=Malayalam}|\p{Script=Gurmukhi}|\p{Script=Arabic}|\p{Script=Hebrew}|\p{Script=Thai}|\p{Script=Myanmar}|\p{Script=Sinhala}|\p{Script=Ethiopic}/u;

export type SentimentLabel = "positive" | "neutral" | "negative";

export type TextSentiment =
  | { kind: "scored"; label: SentimentLabel; comparative: number }
  | { kind: "skipped"; reason: "regional_script" };

export function analyzeTextSentiment(text: string): TextSentiment {
  const t = text.trim();
  if (!t) {
    return { kind: "scored", label: "neutral", comparative: 0 };
  }
  if (REGIONAL_LETTER.test(t)) {
    return { kind: "skipped", reason: "regional_script" };
  }
  const { comparative } = analyzer.analyze(t);
  let label: SentimentLabel = "neutral";
  if (comparative > 0.05) label = "positive";
  else if (comparative < -0.05) label = "negative";
  return { kind: "scored", label, comparative };
}

export function sentimentLabelText(s: TextSentiment): string {
  if (s.kind === "skipped") return "Regional script";
  if (s.label === "positive") return "Positive";
  if (s.label === "negative") return "Negative";
  return "Neutral";
}
