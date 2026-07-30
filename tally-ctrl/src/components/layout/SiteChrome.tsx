import { Link } from "react-router-dom";
import { CATEGORY_CLAIM } from "@/config/positioning";
import type { ReactNode } from "react";

export function SiteChrome({
  children,
  active,
}: {
  children: ReactNode;
  active?: "home" | "estimate" | "preview";
}) {
  return (
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-28 pt-10 sm:px-6">
      <header className="flex flex-col gap-5 border-b border-[var(--tc-line)] pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-xl">
          <Link
            to="/"
            className="text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[var(--tc-ink-muted)]"
          >
            Tally CTRL
          </Link>
          <p className="mt-3 text-[0.95rem] leading-relaxed text-[var(--tc-ink-muted)]">
            {CATEGORY_CLAIM}
          </p>
        </div>
        <nav className="flex gap-6 text-[0.95rem] font-medium tracking-tight">
          <Link
            to="/estimate"
            className={
              active === "estimate"
                ? "text-[var(--tc-accent)]"
                : "text-[var(--tc-ink-muted)] hover:text-[var(--tc-ink)]"
            }
          >
            Estimator
          </Link>
          <Link
            to="/p/demo-faulkner"
            className={
              active === "preview"
                ? "text-[var(--tc-accent)]"
                : "text-[var(--tc-ink-muted)] hover:text-[var(--tc-ink)]"
            }
          >
            Preview portal
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
