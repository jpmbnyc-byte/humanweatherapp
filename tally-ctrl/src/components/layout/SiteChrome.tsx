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
    <div className="mx-auto min-h-screen max-w-5xl px-4 pb-24 pt-8 sm:px-6">
      <header className="flex flex-col gap-4 border-b border-[var(--tc-line)] pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link
            to="/"
            className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--tc-ink-muted)]"
          >
            Tally CTRL
          </Link>
          <p className="mt-2 max-w-xl text-sm text-[var(--tc-ink-muted)]">
            {CATEGORY_CLAIM}
          </p>
        </div>
        <nav className="flex gap-4 text-sm font-medium">
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
            VIN Preview
          </Link>
        </nav>
      </header>
      {children}
    </div>
  );
}
