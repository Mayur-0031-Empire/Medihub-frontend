export const A11Y_STORAGE_KEY = "medihub-a11y";
const STORAGE_KEY = A11Y_STORAGE_KEY;

export type AccessibilitySettings = {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  enhancedFocus: boolean;
};

export const defaultAccessibilitySettings: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  enhancedFocus: false,
};

const defaults = defaultAccessibilitySettings;

export function loadAccessibilitySettings(): AccessibilitySettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...JSON.parse(raw) };
  } catch {
    return { ...defaults };
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function applyAccessibilitySettings(settings: AccessibilitySettings): void {
  const root = document.documentElement;
  root.classList.toggle("mh-a11y-large-text", settings.largeText);
  root.classList.toggle("mh-a11y-high-contrast", settings.highContrast);
  root.classList.toggle("mh-a11y-reduce-motion", settings.reduceMotion);
  root.classList.toggle("mh-a11y-enhanced-focus", settings.enhancedFocus);
}
