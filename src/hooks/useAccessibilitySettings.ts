import { useSettings } from "@/contexts/SettingsContext";

/** @deprecated Prefer useSettings — kept for existing imports. */
export function useAccessibilitySettings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  return {
    settings,
    update: updateSettings,
    reset: resetSettings,
  };
}
