import { useSettings } from "@/contexts/SettingsContext";
import { Label } from "@/components/ui/label";
import { highlightActive, highlightInactive, textOnHighlightActive } from "@/lib/themeClasses";
import { cn } from "@/lib/utils";
import { Contrast, Focus, Moon, RotateCcw, Sun, SunMoon, Type, ZapOff } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

type ThemeChoice = "light" | "dark" | "system";

const themeOptions: { id: ThemeChoice; label: string; icon: typeof Sun }[] = [
  { id: "light", label: "Light", icon: Sun },
  { id: "dark", label: "Dark", icon: Moon },
  { id: "system", label: "Auto", icon: SunMoon },
];

function A11yToggle({
  id,
  label,
  description,
  checked,
  onChange,
  icon: Icon,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: typeof Type;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
      <div className="flex min-w-0 flex-1 gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0">
          <Label htmlFor={id} className="text-sm font-medium text-foreground">
            {label}
          </Label>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
          checked ? "bg-teal-600" : "bg-slate-300 dark:bg-slate-600",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-6" : "translate-x-1",
          )}
        />
        <span className="sr-only">{checked ? "On" : "Off"}</span>
      </button>
    </div>
  );
}

export function AppSettingsPanel({ className }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const { settings, updateSettings, resetSettings } = useSettings();

  useEffect(() => setMounted(true), []);

  const activeTheme = (mounted ? theme : "light") as ThemeChoice | undefined;
  const resolved = mounted ? resolvedTheme : "light";

  return (
    <div className={cn("space-y-6", className)}>
      <section>
        <h3 className="text-sm font-semibold text-foreground">Appearance</h3>
        <p className="mt-1 text-xs text-muted-foreground">Choose light, dark, or match your device (auto).</p>
        {activeTheme === "system" && resolved ? (
          <p className="mt-2 text-xs font-medium text-teal-700 dark:text-teal-400">
            Auto is using {resolved} mode based on your device.
          </p>
        ) : null}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {themeOptions.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                "flex flex-col items-center gap-2 rounded-xl border px-3 py-3 text-xs font-medium transition",
                activeTheme === id ? cn(highlightActive, textOnHighlightActive, "shadow-sm") : highlightInactive,
              )}
              aria-pressed={activeTheme === id}
            >
              <Icon className="h-5 w-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">Accessibility</h3>
          <button
            type="button"
            onClick={resetSettings}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden />
            Reset
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Adjust display and motion for a more comfortable experience.</p>
        <div className="mt-3 space-y-2">
          <A11yToggle
            id="a11y-large-text"
            label="Larger text"
            description="Increase base font size across the app."
            checked={settings.largeText}
            onChange={(v) => updateSettings({ largeText: v })}
            icon={Type}
          />
          <A11yToggle
            id="a11y-high-contrast"
            label="High contrast"
            description="Stronger borders and text contrast."
            checked={settings.highContrast}
            onChange={(v) => updateSettings({ highContrast: v })}
            icon={Contrast}
          />
          <A11yToggle
            id="a11y-reduce-motion"
            label="Reduce motion"
            description="Minimize animations and transitions."
            checked={settings.reduceMotion}
            onChange={(v) => updateSettings({ reduceMotion: v })}
            icon={ZapOff}
          />
          <A11yToggle
            id="a11y-enhanced-focus"
            label="Enhanced focus"
            description="More visible focus rings on interactive elements."
            checked={settings.enhancedFocus}
            onChange={(v) => updateSettings({ enhancedFocus: v })}
            icon={Focus}
          />
        </div>
      </section>
    </div>
  );
}
