import { useEffect, useState } from "react";

export type ChartTheme = {
  grid: string;
  tick: string;
  label: string;
  tooltipBg: string;
  tooltipBorder: string;
  cursor: string;
};

const LIGHT: ChartTheme = {
  grid: "#e2e8f0",
  tick: "#64748b",
  label: "#475569",
  tooltipBg: "#ffffff",
  tooltipBorder: "#e2e8f0",
  cursor: "rgba(13, 148, 136, 0.08)",
};

const DARK: ChartTheme = {
  grid: "#334155",
  tick: "#94a3b8",
  label: "#cbd5e1",
  tooltipBg: "#1e293b",
  tooltipBorder: "#475569",
  cursor: "rgba(45, 212, 191, 0.12)",
};

function readDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

export function useChartTheme(): ChartTheme {
  const [dark, setDark] = useState(readDark);

  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setDark(readDark()));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return dark ? DARK : LIGHT;
}
