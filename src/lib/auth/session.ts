const STORAGE_KEY = "medihub_access_token";
const LEGACY_STORAGE_KEY = "medihub_access_token";

type TokenListener = (token: string | null) => void;
const tokenListeners = new Set<TokenListener>();

function migrateLegacySessionToken(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const legacy = sessionStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacy) {
      localStorage.setItem(STORAGE_KEY, legacy);
      sessionStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  } catch {
    /* private mode / disabled storage */
  }
}

migrateLegacySessionToken();

function readToken(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeToken(token: string | null): void {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    /* private mode / disabled storage */
  }
}

function notifyTokenListeners(token: string | null): void {
  for (const listener of tokenListeners) {
    listener(token);
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) {
      notifyTokenListeners(event.newValue);
    }
  });
}

export function subscribeAccessToken(listener: TokenListener): () => void {
  tokenListeners.add(listener);
  return () => tokenListeners.delete(listener);
}

export function getAccessToken(): string | null {
  return readToken();
}

export function setAccessToken(token: string | null): void {
  writeToken(token);
  notifyTokenListeners(token);
}

export function clearAccessToken(): void {
  writeToken(null);
  notifyTokenListeners(null);
}

/** Non-HttpOnly `accessToken` cookie only (HttpOnly cookies are invisible to JS). */
export function readAccessTokenFromCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)accessToken=([^;]+)/);
  if (!match?.[1]) return null;
  try {
    return normalizeBearerValue(decodeURIComponent(match[1]));
  } catch {
    return normalizeBearerValue(match[1]);
  }
}

function normalizeBearerValue(value: string): string {
  const t = value.trim();
  if (t.length === 0) return t;
  if (t.toLowerCase().startsWith("bearer ")) return t.slice(7).trim();
  return t;
}

/**
 * Pull access token from common API response shapes (body may be full JSON or inner `data`).
 */
export function extractAccessTokenFromAuthResponse(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const root = body as Record<string, unknown>;

  const pick = (o: unknown, depth = 0): string | null => {
    if (depth > 4 || !o || typeof o !== "object") return null;
    const r = o as Record<string, unknown>;
    const candidates = [
      r.accessToken,
      r.access_token,
      r.token,
      r.jwt,
      r.authToken,
      r.auth_token,
      r.access,
    ];
    for (const c of candidates) {
      if (typeof c === "string" && c.length > 0) return normalizeBearerValue(c);
    }
    if (r.tokens && typeof r.tokens === "object") {
      const t = r.tokens as Record<string, unknown>;
      const x = t.accessToken ?? t.access_token ?? t.token ?? t.access ?? t.jwt;
      if (typeof x === "string" && x.length > 0) return normalizeBearerValue(x);
    }
    for (const key of ["session", "auth", "credentials"] as const) {
      const nested = r[key];
      const inner = pick(nested, depth + 1);
      if (inner) return inner;
    }
    return null;
  };

  return pick(root) ?? pick(root.data) ?? pick(root.result);
}

/** OAuth / magic-link redirects sometimes append the JWT to the URL (query or hash). */
export function extractAccessTokenFromUrl(search: URLSearchParams, hash: string): string | null {
  const queryKeys = ["access_token", "accessToken", "token", "jwt", "id_token"];
  for (const k of queryKeys) {
    const v = search.get(k);
    if (v && v.length > 0) return normalizeBearerValue(v);
  }
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!raw.trim()) return null;
  const hp = new URLSearchParams(raw);
  for (const k of queryKeys) {
    const v = hp.get(k);
    if (v && v.length > 0) return normalizeBearerValue(v);
  }
  return null;
}
