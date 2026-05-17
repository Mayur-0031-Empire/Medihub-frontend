/** Response shape from `GET /api/bmi-buddy` (see README). */
export interface BmiBuddyInfo {
  meaning: string;
  requiredParameters: string[];
  categories: BmiCategoryDescriptor[];
}

export type BmiCategoryDescriptor = string | Record<string, unknown>;

/** Response data from `POST /api/bmi-buddy/calculate` (see README). */
export interface BmiCalculatePlans {
  dietPlan: string[];
  workoutPlan: string[];
  lifestylePlan: string[];
}

export interface BmiCalculateResponse {
  bmi: number;
  category: string;
  categoryKey: string;
  note: string;
  plans: BmiCalculatePlans;
}

/** Passed from setup → results via router `location.state`. */
export interface BmiBuddyResultsState {
  heightCm: number;
  weightKg: number;
  result: BmiCalculateResponse;
  source: "api" | "offline";
}
