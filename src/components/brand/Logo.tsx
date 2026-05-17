import { Link } from "react-router-dom";

type LogoSize = "sm" | "md";

const sizeText: Record<LogoSize, string> = {
  sm: "text-lg",
  md: "text-xl sm:text-2xl",
};

const sizeIcon: Record<LogoSize, number> = {
  sm: 32,
  md: 40,
};

export interface LogoProps {
  className?: string;
  size?: LogoSize;
  /** When set, the logo is wrapped in a router link. Omit for display-only. */
  to?: string;
  /** Overrides default `aria-label` on the link (`MediHub home`). */
  linkAriaLabel?: string;
}

/**
 * Single MediHub wordmark + mark. Use everywhere branding should stay consistent.
 */
export function Logo({ className = "", size = "md", to, linkAriaLabel }: LogoProps) {
  const s = sizeIcon[size];
  const mark = (
    <svg
      width={s}
      height={s}
      viewBox="0 0 40 40"
      className="shrink-0 text-teal-600"
      aria-hidden
    >
      <rect width="40" height="40" rx="10" fill="currentColor" />
      <path
        d="M20 11v18M11 20h18"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
  const word = (
    <span
      className={`font-bold tracking-tight text-slate-900 ${sizeText[size]}`}
    >
      Medi<span className="text-teal-600">Hub</span>
    </span>
  );

  const body = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      {mark}
      {word}
    </span>
  );

  if (to) {
    return (
      <Link
        to={to}
        aria-label={linkAriaLabel ?? "MediHub home"}
        className="inline-flex rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2"
      >
        {body}
      </Link>
    );
  }

  return body;
}
