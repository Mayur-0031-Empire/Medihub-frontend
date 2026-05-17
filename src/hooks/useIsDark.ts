import { useEffect, useState } from "react";

function readDark(): boolean {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
}

/** True when the active theme resolves to dark (class on `<html>`). */
export function useIsDark(): boolean {
  const [dark, setDark] = useState(readDark);

  useEffect(() => {
    const root = document.documentElement;
    const obs = new MutationObserver(() => setDark(readDark()));
    obs.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);

  return dark;
}
