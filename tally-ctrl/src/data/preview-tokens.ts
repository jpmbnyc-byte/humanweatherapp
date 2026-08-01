import type { PreviewToken } from "@/schema/types";

/**
 * Static token / vanity-slug registry for the Stage-6 preview.
 * Production can load from preview_token; this keeps the teaser DB-free.
 *
 * For one-off client sends without editing this file, mint a t1.* payload
 * or use /p/c?name=… (see preview-access.ts + /mint).
 */
export const PREVIEW_TOKENS: PreviewToken[] = [
  {
    token: "demo-faulkner",
    slug: "faulkner",
    prospectName: "Faulkner Automotive Group",
    franchise: "honda",
    sampleVehicleKey: "honda-accord-22",
    sampleUnitCount: 200,
    expiresAt: "2099-12-31T23:59:59.000Z",
  },
  {
    token: "demo-toyota-group",
    slug: "pacific-toyota",
    prospectName: "Pacific Toyota Group",
    franchise: "toyota",
    sampleVehicleKey: "toyota-camry-21",
    sampleUnitCount: 180,
    expiresAt: "2099-12-31T23:59:59.000Z",
  },
  {
    token: "demo-ford-family",
    slug: "riverside-ford",
    prospectName: "Riverside Ford Family",
    franchise: "ford",
    sampleVehicleKey: "ford-escape-22",
    sampleUnitCount: 220,
    expiresAt: "2099-12-31T23:59:59.000Z",
  },
  {
    token: "demo-expired",
    slug: "expired-demo",
    prospectName: "Expired Preview Prospect",
    franchise: "honda",
    sampleVehicleKey: "honda-accord-22",
    sampleUnitCount: 200,
    expiresAt: "2020-01-01T00:00:00.000Z",
  },
];

const openLog = new Map<string, { first: string; last: string; count: number }>();

export function lookupToken(token: string): PreviewToken | null {
  return PREVIEW_TOKENS.find((t) => t.token === token) ?? null;
}

export function lookupTokenBySlug(slug: string): PreviewToken | null {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  return (
    PREVIEW_TOKENS.find((t) => t.slug?.toLowerCase() === key) ??
    PREVIEW_TOKENS.find((t) => t.token.toLowerCase() === key) ??
    null
  );
}

export function isTokenExpired(token: PreviewToken, now = new Date()): boolean {
  return new Date(token.expiresAt).getTime() < now.getTime();
}

/** Page-load attribution — real signal vs email open pixel. */
export function recordTokenOpen(token: string, now = new Date()): void {
  const iso = now.toISOString();
  const existing = openLog.get(token);
  if (existing) {
    existing.last = iso;
    existing.count += 1;
  } else {
    openLog.set(token, { first: iso, last: iso, count: 1 });
  }
}

export function getTokenOpenStats(token: string) {
  return openLog.get(token) ?? null;
}

/** Build a 21-day expiry from an issue date (for minting helpers). */
export function expiryFromIssue(issuedAt = new Date(), days = 21): string {
  const d = new Date(issuedAt);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}
