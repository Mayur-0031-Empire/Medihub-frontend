import type { BmiBuddyInfo, BmiCalculateResponse } from "@/types/bmi";
import {
  assertMedihubServerConfigured,
  bmiBuddyCalculatePath,
  bmiBuddyInfoPath,
} from "@/lib/config";
import { formatBmiRequiredParameterLine } from "@/lib/bmi/local";
import { formatApiFailure, medihubFetch, parseJsonSafe, unwrapData } from "./client";

export async function fetchBmiBuddyInfo(): Promise<BmiBuddyInfo> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${bmiBuddyInfoPath()}`, {
    method: "GET",
    credentials: "include",
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `Could not load BMI info`));
  }
  const raw = unwrapData<Record<string, unknown>>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const data = raw.data;
  return {
    meaning: typeof data.meaning === "string" ? data.meaning : "",
    requiredParameters: Array.isArray(data.requiredParameters)
      ? data.requiredParameters.map(formatBmiRequiredParameterLine).filter((s) => s.length > 0)
      : [],
    categories: Array.isArray(data.categories) ? (data.categories as BmiBuddyInfo["categories"]) : [],
  };
}

export async function calculateBmi(heightCm: number, weightKg: number): Promise<BmiCalculateResponse> {
  const base = assertMedihubServerConfigured();
  const res = await medihubFetch(`${base}${bmiBuddyCalculatePath()}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ heightCm, weightKg }),
  });
  const body = await parseJsonSafe(res);
  if (!res.ok) {
    throw new Error(formatApiFailure(body, `BMI calculation failed`));
  }
  const raw = unwrapData<Record<string, unknown>>(body);
  if (!raw.ok) {
    throw new Error(raw.message);
  }
  const o = raw.data;
  const bmi = Number(o.bmi);
  if (!Number.isFinite(bmi)) {
    throw new Error("Unexpected BMI response: missing numeric bmi.");
  }
  const plansRaw = o.plans && typeof o.plans === "object" ? (o.plans as Record<string, unknown>) : {};
  return {
    bmi,
    category: String(o.category ?? ""),
    categoryKey: String(o.categoryKey ?? "normal").toLowerCase(),
    note: String(o.note ?? ""),
    plans: {
      dietPlan: Array.isArray(plansRaw.dietPlan) ? plansRaw.dietPlan.map(String) : [],
      workoutPlan: Array.isArray(plansRaw.workoutPlan) ? plansRaw.workoutPlan.map(String) : [],
      lifestylePlan: Array.isArray(plansRaw.lifestylePlan) ? plansRaw.lifestylePlan.map(String) : [],
    },
  };
}
