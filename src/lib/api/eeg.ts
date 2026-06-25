import {
  assertMedihubServerConfigured,
  eegAppointmentLatestPath,
  eegLatestPath,
  eegPredictPath,
  eegSamplesPath,
} from "@/lib/config";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export type StressLevel = "Low" | "Medium" | "High";

export type EegStressPrediction = {
  label: "NEGATIVE" | "NEUTRAL" | "POSITIVE";
  stressLevel: StressLevel;
  confidence: number;
  probabilities?: Record<string, number>;
  source?: "model" | "fallback";
  score?: number;
  message?: string;
  predictionError?: string;
};

export type EegStressPayload = {
  samples: number[];
  metadata: {
    attention: number | null;
    meditation: number | null;
    poorSignal: number | null;
    sampleRate: number | null;
    receivedAt: string;
  };
  prediction: EegStressPrediction | null;
};

export type EegSampleRequest = {
  samples: number[];
  appointmentId?: string | null;
  attention?: number | null;
  meditation?: number | null;
  poorSignal?: number | null;
  sampleRate?: number | null;
};

async function postEeg(path: string, payload: EegSampleRequest, fallback: string): Promise<EegStressPayload> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, fallback));
  }
  const unwrapped = unwrapData<EegStressPayload>(body);
  if (!unwrapped.ok) throw new Error(unwrapped.message);
  return unwrapped.data;
}

export function predictEegStress(payload: EegSampleRequest): Promise<EegStressPayload> {
  return postEeg(eegPredictPath(), payload, "Could not predict stress level.");
}

export function sendEegSamples(payload: EegSampleRequest): Promise<EegStressPayload> {
  return postEeg(eegSamplesPath(), payload, "Could not send EEG samples.");
}

export async function fetchLatestEegStress(): Promise<EegStressPayload | null> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${eegLatestPath()}`, {
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, "Could not load EEG stress data."));
  }
  const unwrapped = unwrapData<EegStressPayload | null>(body);
  if (!unwrapped.ok) throw new Error(unwrapped.message);
  return unwrapped.data;
}

export async function fetchAppointmentEegStress(appointmentId: string): Promise<EegStressPayload | null> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${eegAppointmentLatestPath(appointmentId)}`, {
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, "Could not load patient EEG stress data."));
  }
  const unwrapped = unwrapData<EegStressPayload | null>(body);
  if (!unwrapped.ok) throw new Error(unwrapped.message);
  return unwrapped.data;
}
