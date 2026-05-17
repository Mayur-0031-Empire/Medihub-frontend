import type { BmiCategoryKey } from "@/lib/bmi/local";
import type { BmiCalculatePlans } from "@/types/bmi";

function isBmiCategoryKey(k: string): k is BmiCategoryKey {
  return k === "underweight" || k === "normal" || k === "overweight" || k === "obese";
}

/**
 * General wellness-oriented suggestions by BMI category (screening context).
 * Shown when the API omits plan items or when using offline fallback — not a medical diagnosis.
 */
const REMEDIES: Record<BmiCategoryKey, BmiCalculatePlans> = {
  underweight: {
    dietPlan: [
      "Eat nutrient-dense meals on a regular schedule (whole grains, lean proteins, nuts, dairy or fortified alternatives).",
      "Add healthy calories with smoothies, avocado, olive oil, and nut butters rather than relying only on sweets.",
    ],
    workoutPlan: [
      "Prioritise strength training 2–3×/week with gradual load increases to support muscle gain.",
      "Keep moderate cardio for heart health without burning off all surplus calories — shorter sessions are fine.",
    ],
    lifestylePlan: [
      "Track weight weekly; if unintentional loss continues, discuss with a clinician or dietitian.",
      "Sleep 7–9 hours — poor sleep can reduce appetite and recovery from training.",
    ],
  },
  normal: {
    dietPlan: [
      "Maintain variety: vegetables, fruit, lean proteins, legumes, and whole grains most of the time.",
      "Keep sugary drinks and ultra-processed snacks occasional rather than daily habits.",
    ],
    workoutPlan: [
      "Aim for ~150 minutes/week of moderate activity (brisk walking, cycling) plus 2 days of muscle-strengthening work.",
      "Break up long sitting with short movement breaks every hour.",
    ],
    lifestylePlan: [
      "Your BMI sits in a commonly cited healthy range — focus on energy, strength, and habits you can sustain.",
      "Annual check-ups still matter; BMI does not capture muscle vs fat or overall metabolic health.",
    ],
  },
  overweight: {
    dietPlan: [
      "Build meals around vegetables and protein; use smaller plates to gently reduce portions without harsh restriction.",
      "Limit sugar-sweetened beverages; choose water, tea, or sparkling water most of the time.",
    ],
    workoutPlan: [
      "Low-impact cardio (walking, swimming, elliptical) most days supports joints while increasing calorie use.",
      "Add resistance training to preserve muscle while working toward a gradual, sustainable pace of change.",
    ],
    lifestylePlan: [
      "A steady loss of ~0.25–0.5 kg per week is often sustainable; very fast diets are harder to maintain.",
      "Stress and sleep affect appetite — simple routines (fixed wake time, wind-down) can help consistency.",
    ],
  },
  obese: {
    dietPlan: [
      "Work with a clinician or dietitian for a structured plan, especially if you have diabetes, hypertension, or joint pain.",
      "Emphasise vegetables, lean protein, and high-fibre foods; plan meals ahead to reduce impulse eating.",
    ],
    workoutPlan: [
      "Start where you are: short daily walks, water exercise, or seated cardio can all count.",
      "Increase duration slowly; joint-friendly options reduce injury risk as activity rises.",
    ],
    lifestylePlan: [
      "Small sustained changes outperform extreme short-term diets for long-term health markers.",
      "Screen for sleep apnoea if you snore or feel tired — it can affect weight and energy.",
    ],
  },
};

export function mergePlansWithRemedies(
  categoryKey: string,
  apiPlans: BmiCalculatePlans | undefined,
): BmiCalculatePlans {
  const fbKey = isBmiCategoryKey(categoryKey) ? categoryKey : "normal";
  const fallback = REMEDIES[fbKey];

  const pick = (api: string[] | undefined, fb: string[]): string[] => {
    const a = api?.filter((s) => typeof s === "string" && s.trim().length > 0) ?? [];
    if (a.length > 0) return a;
    return fb;
  };

  return {
    dietPlan: pick(apiPlans?.dietPlan, fallback.dietPlan),
    workoutPlan: pick(apiPlans?.workoutPlan, fallback.workoutPlan),
    lifestylePlan: pick(apiPlans?.lifestylePlan, fallback.lifestylePlan),
  };
}
