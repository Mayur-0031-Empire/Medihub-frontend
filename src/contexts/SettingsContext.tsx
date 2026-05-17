import {
  applyAccessibilitySettings,
  defaultAccessibilitySettings,
  A11Y_STORAGE_KEY,
  loadAccessibilitySettings,
  saveAccessibilitySettings,
  type AccessibilitySettings,
} from "@/lib/theme/accessibility";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type SettingsContextValue = {
  settings: AccessibilitySettings;
  updateSettings: (patch: Partial<AccessibilitySettings>) => void;
  resetSettings: () => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    const loaded = loadAccessibilitySettings();
    applyAccessibilitySettings(loaded);
    return loaded;
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== A11Y_STORAGE_KEY || !e.newValue) return;
      try {
        const next = { ...defaultAccessibilitySettings, ...JSON.parse(e.newValue) };
        setSettings(next);
        applyAccessibilitySettings(next);
      } catch {
        /* ignore */
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    applyAccessibilitySettings(settings);
  }, [settings]);

  const updateSettings = useCallback((patch: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveAccessibilitySettings(next);
      applyAccessibilitySettings(next);
      return next;
    });
  }, []);

  const resetSettings = useCallback(() => {
    const next = { ...defaultAccessibilitySettings };
    saveAccessibilitySettings(next);
    applyAccessibilitySettings(next);
    setSettings(next);
  }, []);

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettings }),
    [settings, updateSettings, resetSettings],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within SettingsProvider");
  }
  return ctx;
}
