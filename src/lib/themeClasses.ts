/**
 * Shared text / icon / surface classes for consistent light + dark contrast.
 * Prefer these over raw slate utilities on new UI.
 */
export const textHeading = "text-slate-900 dark:text-slate-50";
export const textBody = "text-slate-700 dark:text-slate-200";
export const textMuted = "text-slate-600 dark:text-slate-300";
export const textSubtle = "text-slate-500 dark:text-slate-400";

/** Wrap video stages, modals on dark canvas — skips global slate text remaps */
export const onDarkSurface = "mh-on-dark";

export const textOnDark = "text-white";
export const textOnDarkMuted = "text-slate-300";
export const textOnDarkSubtle = "text-slate-400";

export const iconBrand = "text-teal-600 dark:text-teal-400";
export const iconMuted = "text-slate-500 dark:text-slate-400";
export const iconOnBrand = "text-white";

export const linkBrand =
  "font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300";

export const surfaceCard =
  "rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900";

export const surfaceMuted =
  "rounded-xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800/90 dark:text-slate-200";

export const surfaceInput =
  "border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100";

export const btnIcon =
  "rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50";

/** Round media controls (mute, camera) */
export const btnMediaControl =
  "inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700";

/** Primary CTA — white label on deep teal in both themes */
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold !text-white shadow-md shadow-teal-600/25 transition hover:bg-teal-700 disabled:pointer-events-none disabled:opacity-50";

/** Selected role/card/tab (not a solid fill) */
export const highlightActive =
  "border-teal-600 bg-teal-50 ring-2 ring-teal-600/20 dark:border-teal-500 dark:bg-teal-950/50 dark:ring-teal-500/35";

export const highlightInactive =
  "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-600 dark:bg-slate-800/90 dark:hover:border-slate-500";

/** Pill tab — active segment */
export const tabActive = "bg-teal-600 !text-white shadow-sm";
export const tabInactive = "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800";

/** Text on highlightActive surfaces */
export const textOnHighlightActive = "text-teal-900 dark:text-teal-100";
export const textOnHighlightInactive = "text-slate-800 dark:text-slate-200";
