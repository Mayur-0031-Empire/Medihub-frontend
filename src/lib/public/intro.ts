export const INTRO_COMPLETE_KEY = "medihub-intro-complete";

export function hasCompletedIntro(): boolean {
  try {
    return sessionStorage.getItem(INTRO_COMPLETE_KEY) === "1";
  } catch {
    return false;
  }
}

export function markIntroComplete(): void {
  try {
    sessionStorage.setItem(INTRO_COMPLETE_KEY, "1");
  } catch {
    /* ignore */
  }
}
