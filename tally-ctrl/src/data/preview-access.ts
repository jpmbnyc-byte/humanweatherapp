/**
 * Preview portal access — three ways to land a client on a personalized portal:
 *
 * 1. Registry token / slug   → /p/demo-faulkner  or  /p/faulkner-auto
 * 2. Minted payload token    → /p/t1.<base64url-json>  (no redeploy)
 * 3. Template query params   → /p/c?name=…&franchise=…&units=…&days=21
 *
 * Vanity subdomain (optional):
 *   https://{slug}.preview.tallyctrl.com  → same app, slug resolves like /p/{slug}
 */
import {
  expiryFromIssue,
  lookupToken,
  lookupTokenBySlug,
} from "@/data/preview-tokens";
import type { PreviewToken, ReconEconomics } from "@/schema/types";

export const TEMPLATE_TOKEN = "c";

/** Public host used when composing send links (override via VITE_PREVIEW_HOST). */
export function previewHost(): string {
  return (
    (import.meta.env.VITE_PREVIEW_HOST as string | undefined)?.replace(
      /^https?:\/\//,
      "",
    ) || "preview.tallyctrl.com"
  );
}

export interface MintInput {
  prospectName: string;
  /** URL-safe vanity slug, e.g. faulkner-auto */
  slug?: string;
  franchise?: string | null;
  sampleUnitCount?: number;
  /** Days until expiry (default 21). */
  days?: number;
  defaults?: Partial<ReconEconomics>;
}

export interface MintedLinks {
  /** Works immediately — no DNS, no registry edit */
  pathUrl: string;
  /** Path + short template token with query (mail-merge friendly) */
  templateUrl: string;
  /** Requires wildcard DNS *.preview.tallyctrl.com */
  subdomainUrl: string | null;
  /** Payload token string (t1.… ) */
  payloadToken: string;
  record: PreviewToken;
}

type PayloadV1 = {
  v: 1;
  n: string;
  s?: string;
  f?: string | null;
  u?: number;
  e: string;
  d?: Partial<ReconEconomics>;
};

function toBase64Url(json: string): string {
  const bytes = new TextEncoder().encode(json);
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(raw: string): string | null {
  try {
    const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
    const b64 = raw.replace(/-/g, "+").replace(/_/g, "/") + pad;
    const bin = atob(b64);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function encodePayloadToken(input: MintInput, issuedAt = new Date()): string {
  const days = input.days ?? 21;
  const payload: PayloadV1 = {
    v: 1,
    n: input.prospectName.trim(),
    e: expiryFromIssue(issuedAt, days),
  };
  const slug = (input.slug ?? slugify(input.prospectName)).trim();
  if (slug) payload.s = slug;
  if (input.franchise) payload.f = input.franchise.toLowerCase();
  if (input.sampleUnitCount && input.sampleUnitCount > 0) {
    payload.u = Math.round(input.sampleUnitCount);
  }
  if (input.defaults) payload.d = input.defaults;
  return `t1.${toBase64Url(JSON.stringify(payload))}`;
}

export function decodePayloadToken(token: string): PreviewToken | null {
  if (!token.startsWith("t1.")) return null;
  const json = fromBase64Url(token.slice(3));
  if (!json) return null;
  try {
    const parsed = JSON.parse(json) as PayloadV1;
    if (parsed.v !== 1 || !parsed.n || !parsed.e) return null;
    const slug = parsed.s ?? slugify(parsed.n);
    return {
      token,
      slug,
      prospectName: parsed.n,
      franchise: parsed.f ?? null,
      sampleVehicleKey: null,
      sampleUnitCount: parsed.u && parsed.u > 0 ? parsed.u : 200,
      expiresAt: parsed.e,
      defaults: parsed.d,
    };
  } catch {
    return null;
  }
}

/** Parse `{slug}.preview.tallyctrl.com` → slug (null for apex / www / preview). */
export function parseHostSlug(
  hostname: string,
  baseHost = previewHost(),
): string | null {
  const host = hostname.toLowerCase().split(":")[0];
  const base = baseHost.toLowerCase();
  if (host === base || host === `www.${base}`) return null;

  if (host.endsWith(`.${base}`)) {
    const sub = host.slice(0, -(base.length + 1));
    if (!sub || sub.includes(".") || sub === "www") return null;
    return sub;
  }

  // Also allow `{slug}.tallyctrl.com` when base is preview.tallyctrl.com
  if (base.startsWith("preview.") && host.endsWith(".tallyctrl.com")) {
    const sub = host.replace(/\.tallyctrl\.com$/, "");
    if (!sub || sub === "preview" || sub === "www" || sub.includes(".")) {
      return null;
    }
    return sub;
  }

  return null;
}

function fromQuery(
  params: URLSearchParams,
  tokenHint: string,
): PreviewToken | null {
  const name =
    params.get("name") ??
    params.get("n") ??
    params.get("prospect") ??
    params.get("company");
  if (!name?.trim()) return null;

  const franchise = params.get("franchise") ?? params.get("f");
  const unitsRaw = params.get("units") ?? params.get("u");
  const daysRaw = params.get("days") ?? params.get("d");
  const slugParam = params.get("slug") ?? params.get("s");
  const units = unitsRaw ? Number.parseInt(unitsRaw, 10) : 200;
  const days = daysRaw ? Number.parseInt(daysRaw, 10) : 21;

  return {
    token: tokenHint || TEMPLATE_TOKEN,
    slug: slugParam?.trim() || slugify(name),
    prospectName: name.trim(),
    franchise: franchise ? franchise.toLowerCase() : null,
    sampleVehicleKey: null,
    sampleUnitCount:
      Number.isFinite(units) && units > 0 ? units : 200,
    expiresAt: expiryFromIssue(
      new Date(),
      Number.isFinite(days) && days > 0 ? days : 21,
    ),
  };
}

export interface ResolveArgs {
  /** Path param from /p/:token */
  token?: string | null;
  hostname?: string;
  search?: string | URLSearchParams;
}

/**
 * Resolve a personalized preview record from path token, query template,
 * or vanity subdomain slug.
 */
export function resolvePreviewAccess(args: ResolveArgs): PreviewToken | null {
  const hostname =
    args.hostname ??
    (typeof window !== "undefined" ? window.location.hostname : "");
  const params =
    typeof args.search === "string"
      ? new URLSearchParams(args.search)
      : (args.search ??
        (typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams()));

  const rawToken = (args.token ?? "").trim();
  const hostSlug = parseHostSlug(hostname);

  // 1) Minted payload
  if (rawToken.startsWith("t1.")) {
    return decodePayloadToken(rawToken);
  }

  // 2) Registry by exact token
  if (rawToken) {
    const byToken = lookupToken(rawToken);
    if (byToken) return byToken;
  }

  // 3) Registry by path slug (friendly /p/faulkner-auto)
  if (rawToken) {
    const bySlug = lookupTokenBySlug(rawToken);
    if (bySlug) return bySlug;
  }

  // 4) Template query on /p/c or any unknown token with ?name=
  if (rawToken === TEMPLATE_TOKEN || rawToken === "preview" || rawToken === "go") {
    const q = fromQuery(params, rawToken);
    if (q) return q;
  }
  if (rawToken && params.has("name")) {
    const q = fromQuery(params, rawToken);
    if (q) return q;
  }

  // 5) Vanity subdomain → registry slug, else query on subdomain root
  if (hostSlug) {
    const byHost = lookupTokenBySlug(hostSlug) ?? lookupToken(hostSlug);
    if (byHost) return byHost;
    if (params.has("name") || params.has("n")) {
      const q = fromQuery(params, hostSlug);
      if (q) {
        return { ...q, slug: hostSlug, token: hostSlug };
      }
    }
  }

  return null;
}

/** Build copy-paste links for a client send. */
export function mintPreviewLinks(input: MintInput): MintedLinks {
  const prospectName = input.prospectName.trim();
  const slug = (input.slug ?? slugify(prospectName)).trim() || "client";
  const franchise = input.franchise ?? null;
  const sampleUnitCount = input.sampleUnitCount ?? 200;
  const days = input.days ?? 21;
  const payloadToken = encodePayloadToken({
    ...input,
    prospectName,
    slug,
    franchise,
    sampleUnitCount,
    days,
  });
  const record = decodePayloadToken(payloadToken)!;
  const host = previewHost();

  const qs = new URLSearchParams({
    name: prospectName,
    units: String(sampleUnitCount),
    days: String(days),
    slug,
  });
  if (franchise) qs.set("franchise", franchise);

  return {
    payloadToken,
    record,
    pathUrl: `https://${host}/p/${payloadToken}`,
    templateUrl: `https://${host}/p/${TEMPLATE_TOKEN}?${qs.toString()}`,
    subdomainUrl: `https://${slug}.${host}/p/${payloadToken}`,
  };
}

/** Mail-merge template (replace {{…}} before sending). */
export function mailMergeTemplate(): string {
  const host = previewHost();
  return `https://${host}/p/${TEMPLATE_TOKEN}?name={{company_name}}&franchise={{franchise}}&units={{used_units_sample}}&days=21&slug={{slug}}`;
}
