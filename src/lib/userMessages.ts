/** User-facing copy — no API paths, env vars, or setup instructions. */

export const SERVICE_UNAVAILABLE =
  "This feature is temporarily unavailable. Please try again later.";

export const SERVICE_UNAVAILABLE_AUTH =
  "Sign-in is temporarily unavailable. Please try again later.";

export const SERVICE_UNAVAILABLE_CHAT =
  "The care assistant is temporarily unavailable. Please try again later.";

export const HOSPITAL_SEARCH_UNAVAILABLE =
  "Hospital search is temporarily unavailable. Please try again later.";

export const NETWORK_ERROR =
  "Unable to reach MediHub right now. Check your connection and try again.";

/** Patterns that indicate a vendor or infrastructure error — never show these verbatim. */
const TECHNICAL_MESSAGE_PATTERNS: { test: RegExp; message: string }[] = [
  {
    test: /places\s*api|places\.googleapis\.com|hospital.?locator/i,
    message: HOSPITAL_SEARCH_UNAVAILABLE,
  },
  {
    test: /console\.developers\.google\.com|googleapis\.com|google\s+cloud/i,
    message: SERVICE_UNAVAILABLE,
  },
  {
    test: /has not been used in project|enable it by visiting|propagate to our systems/i,
    message: SERVICE_UNAVAILABLE,
  },
  { test: /\/api\/|vite_|\.env\b|cors\b|oauth\b/i, message: SERVICE_UNAVAILABLE },
  { test: /https?:\/\//i, message: SERVICE_UNAVAILABLE },
  { test: /local setup|not connected to medihub|notifications api/i, message: SERVICE_UNAVAILABLE },
  { test: /\bproject\s+\d{6,}\b/i, message: SERVICE_UNAVAILABLE },
];

/**
 * Strips vendor/setup details from backend or third-party error text before showing in the UI.
 */
export function sanitizeUserFacingMessage(message: string, fallback = SERVICE_UNAVAILABLE): string {
  const trimmed = message.trim();
  if (!trimmed) return fallback;
  for (const { test, message: replacement } of TECHNICAL_MESSAGE_PATTERNS) {
    if (test.test(trimmed)) return replacement;
  }
  return trimmed;
}

/** Safe message from a caught error for alerts and form errors. */
export function userFacingError(error: unknown, fallback = SERVICE_UNAVAILABLE): string {
  if (error instanceof Error) {
    return sanitizeUserFacingMessage(error.message, fallback);
  }
  if (typeof error === "string") {
    return sanitizeUserFacingMessage(error, fallback);
  }
  return fallback;
}
