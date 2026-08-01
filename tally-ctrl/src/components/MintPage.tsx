import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SiteChrome } from "@/components/layout/SiteChrome";
import {
  mailMergeTemplate,
  mintPreviewLinks,
  previewHost,
  slugify,
} from "@/data/preview-access";

/**
 * Internal compose tool — mint a personalized preview link to paste into
 * Stage-6 outreach. Not linked from the public nav.
 */
export function MintPage() {
  const [prospectName, setProspectName] = useState("Faulkner Automotive Group");
  const [slug, setSlug] = useState("faulkner");
  const [franchise, setFranchise] = useState("honda");
  const [units, setUnits] = useState(200);
  const [days, setDays] = useState(21);
  const [copied, setCopied] = useState<string | null>(null);

  const links = useMemo(
    () =>
      mintPreviewLinks({
        prospectName,
        slug: slug || slugify(prospectName),
        franchise: franchise || null,
        sampleUnitCount: units,
        days,
      }),
    [prospectName, slug, franchise, units, days],
  );

  async function copy(label: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      setCopied("failed");
    }
  }

  return (
    <SiteChrome>
      <header className="mt-12 max-w-2xl">
        <p className="tc-eyebrow">Internal · Stage-6 send</p>
        <h1 className="mt-3 font-display text-[2.5rem] leading-tight md:text-5xl">
          Mint a client preview link
        </h1>
        <p className="mt-4 text-[1.05rem] leading-relaxed text-[var(--tc-ink-muted)]">
          Fill the fields, copy a URL, paste into email. Payload links work
          immediately — no redeploy. Vanity subdomains need wildcard DNS on{" "}
          <span className="tabular-nums">{previewHost()}</span>.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-2">
        <form
          className="space-y-6"
          onSubmit={(e) => e.preventDefault()}
        >
          <label className="tc-field">
            <span className="tc-label">Prospect / group name</span>
            <input
              className="tc-input"
              value={prospectName}
              onChange={(e) => {
                setProspectName(e.target.value);
                if (!slug || slug === slugify(prospectName)) {
                  setSlug(slugify(e.target.value));
                }
              }}
            />
          </label>

          <label className="tc-field">
            <span className="tc-label">Vanity slug</span>
            <input
              className="tc-input"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-"),
                )
              }
            />
            <span className="tc-field-hint">
              Used in {`{slug}.`}{previewHost()} and /p/{`{slug}`}
            </span>
          </label>

          <div className="grid gap-6 sm:grid-cols-3">
            <label className="tc-field">
              <span className="tc-label">Franchise</span>
              <input
                className="tc-input"
                value={franchise}
                onChange={(e) => setFranchise(e.target.value)}
                placeholder="honda"
              />
            </label>
            <label className="tc-field">
              <span className="tc-label">Sample units</span>
              <input
                className="tc-input"
                inputMode="numeric"
                value={units}
                onChange={(e) =>
                  setUnits(Number.parseInt(e.target.value, 10) || 0)
                }
              />
            </label>
            <label className="tc-field">
              <span className="tc-label">Expires (days)</span>
              <input
                className="tc-input"
                inputMode="numeric"
                value={days}
                onChange={(e) =>
                  setDays(Number.parseInt(e.target.value, 10) || 21)
                }
              />
            </label>
          </div>
        </form>

        <div className="space-y-6">
          <LinkBlock
            title="Send this (recommended)"
            blurb="Encoded payload — personalized, expires, works without DNS changes."
            value={links.pathUrl}
            copied={copied === "path"}
            onCopy={() => copy("path", links.pathUrl)}
          />
          <LinkBlock
            title="Mail-merge template"
            blurb="Drop into your sequencer; replace {{fields}} per account."
            value={mailMergeTemplate()}
            copied={copied === "merge"}
            onCopy={() => copy("merge", mailMergeTemplate())}
          />
          <LinkBlock
            title="Query template (this prospect)"
            blurb="Readable URL — good for CRM merge when you want editable params."
            value={links.templateUrl}
            copied={copied === "template"}
            onCopy={() => copy("template", links.templateUrl)}
          />
          <LinkBlock
            title="Vanity subdomain"
            blurb="Requires wildcard DNS *.preview → same Render static site."
            value={links.subdomainUrl ?? ""}
            copied={copied === "sub"}
            onCopy={() =>
              links.subdomainUrl && copy("sub", links.subdomainUrl)
            }
          />

          <p className="text-sm text-[var(--tc-ink-muted)]">
            Preview:{" "}
            <Link
              className="font-semibold text-[var(--tc-accent)] underline-offset-2 hover:underline"
              to={`/p/${links.payloadToken}`}
            >
              open minted portal
            </Link>
            {" · "}
            <Link
              className="font-semibold text-[var(--tc-accent)] underline-offset-2 hover:underline"
              to={`/p/c?${new URL(links.templateUrl).searchParams.toString()}`}
            >
              open query form
            </Link>
          </p>
        </div>
      </div>
    </SiteChrome>
  );
}

function LinkBlock({
  title,
  blurb,
  value,
  copied,
  onCopy,
}: {
  title: string;
  blurb: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-xl border border-[var(--tc-line)] bg-white/55 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--tc-ink)]">{title}</p>
          <p className="mt-1 text-[0.8rem] leading-snug text-[var(--tc-ink-muted)]">
            {blurb}
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className="shrink-0 rounded-md border border-[var(--tc-line)] bg-white/80 px-3 py-1.5 text-xs font-semibold"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <p className="mt-3 break-all font-mono text-[0.72rem] leading-relaxed text-[var(--tc-ink)]">
        {value}
      </p>
    </div>
  );
}
