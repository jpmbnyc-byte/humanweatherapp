# Client preview sends — template URLs & vanity subdomains

Stage-6 VIN Preview is meant to be **personalized per prospect** and pasted
into outreach. You do **not** need a DMS upload or a redeploy for each send.

Public host (default): `https://preview.tallyctrl.com`  
Override compose host with `VITE_PREVIEW_HOST` at build time.

---

## Fast path — mint a link

1. Open **`/mint`** on the preview host (internal compose tool).
2. Enter prospect name, franchise, sample units, expiry days.
3. Copy **Send this (recommended)** — a `t1.*` payload URL.
4. Paste into email / LinkedIn.

Example shape:

```text
https://preview.tallyctrl.com/p/t1.<encoded-prospect-payload>
```

The portal reads the payload client-side: name, franchise, unit count, expiry.
No registry edit, no DNS change.

---

## Mail-merge template (sequencer / CRM)

```text
https://preview.tallyctrl.com/p/c?name={{company_name}}&franchise={{franchise}}&units={{used_units_sample}}&days=21&slug={{slug}}
```

| Param | Aliases | Meaning |
| --- | --- | --- |
| `name` | `n`, `prospect`, `company` | Group name shown in the portal |
| `franchise` | `f` | Seeds which sample car is selected first |
| `units` | `u` | Sample volume for extrapolation |
| `days` | `d` | Link expiry (default 21) |
| `slug` | `s` | Vanity slug (optional) |

Also available from `/mint` → **Mail-merge template**.

---

## Vanity subdomain per send

### What you get

```text
https://{slug}.preview.tallyctrl.com
```

Examples:

| Send | URL |
| --- | --- |
| Faulkner | `https://faulkner.preview.tallyctrl.com` |
| Minted payload on vanity host | `https://acme-auto.preview.tallyctrl.com/p/t1.…` |

The SPA treats `{slug}.preview.tallyctrl.com/` as `/p/{slug}`.

### DNS (one-time)

At your DNS host for `tallyctrl.com`:

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `preview` | Render target for `tally-ctrl-preview` |
| CNAME | `*.preview` | **Same** Render target |

In Render → **tally-ctrl-preview** → Custom Domains:

1. Keep `preview.tallyctrl.com`
2. Add wildcard `*.preview.tallyctrl.com` if Render offers it for the static site  
   (If wildcard UI is unavailable: add each `{slug}.preview.tallyctrl.com` as you send, or stay on path URLs.)

TLS must cover the wildcard (Render usually provisions this when the domain is attached).

### When does a bare subdomain resolve?

| Host | Resolves if… |
| --- | --- |
| `faulkner.preview.tallyctrl.com` | Slug `faulkner` is in the static registry (`preview-tokens.ts`) |
| `acme-auto.preview…/p/t1.…` | Always — payload carries the prospect |
| `acme-auto.preview…/?name=Acme` | Query template on the vanity host |

**Recommendation:** for cold sends, use the **minted path URL** (`/p/t1.…`).  
Use vanity subdomains when you want the branded host in the email and either
(a) the slug is registered, or (b) you append `/p/t1.…`.

### Registering a lasting vanity slug

Add a row to `tally-ctrl/src/data/preview-tokens.ts`:

```ts
{
  token: "acme-auto-2026",
  slug: "acme-auto",
  prospectName: "Acme Auto Group",
  franchise: "toyota",
  sampleVehicleKey: null,
  sampleUnitCount: 180,
  expiresAt: "2026-09-01T00:00:00.000Z",
}
```

Merge → deploy → `https://acme-auto.preview.tallyctrl.com` works at `/`.

---

## Which link should I send?

| Situation | Use |
| --- | --- |
| One-off Stage-6 email today | `/mint` → payload path URL |
| Sequencer / mail merge | `/p/c?name={{company_name}}&…` |
| Branded host, lasting prospect | Register `slug` + wildcard DNS |
| Demo / QA | `/p/demo-faulkner` or `/p/faulkner` |

---

## Security note

Payload and query links are **obfuscated, not cryptographic secrets**. Anyone
with the URL can open the teaser. That matches Stage-6 intent (no DMS data).
Do not put real customer VINs or private economics in the URL.
