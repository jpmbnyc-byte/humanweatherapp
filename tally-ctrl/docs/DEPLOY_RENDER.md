# Deploy Tally CTRL on Render → `preview.tallyctrl.com`

The free-tool surface (`tally-ctrl`) is a **static site** on Render, separate
from Human Weather’s Node service. Blueprint entry: `tally-ctrl-preview` in
[`render.yaml`](../../render.yaml).

| Route | Product |
| --- | --- |
| `/` | Landing |
| `/estimate` | Variance Pool Estimator |
| `/p/{token}` | VIN Preview |

---

## 1. Merge & sync the Blueprint

1. Merge PR #35 (or push `tally-ctrl/` + updated `render.yaml` to `main`).
2. [Render Dashboard](https://dashboard.render.com) → your workspace.
3. If the repo is already a Blueprint: **Blueprints → Sync** (or push triggers sync).
4. If not: **New → Blueprint** → connect `jpmbnyc-byte/humanweatherapp` → apply `render.yaml`.

You should see a new service: **`tally-ctrl-preview`** (runtime: Static).

> Static sites on Render do **not** take `plan: free` in the Blueprint — omit
> `plan`. Static hosting is still free; `plan` only applies to Node web services
> (like Human Weather).

Human Weather (`humanweather`) keeps deploying as before; its `buildFilter`
ignores `tally-ctrl/**` so Estimator edits don’t rebuild HW.

---

## 2. First deploy (without custom domain)

1. Open **tally-ctrl-preview** → wait for the build (`npm install && npm run build` in `tally-ctrl/`).
2. Open the Render URL (e.g. `https://tally-ctrl-preview.onrender.com`).
3. Smoke:
   - `/`
   - `/estimate`
   - `/p/demo-faulkner`
   - Hard-refresh each path (SPA rewrite must serve `index.html`).

Optional env (Dashboard → Environment), then **Manual Deploy**:

| Key | Notes |
| --- | --- |
| `VITE_GEMINI_API_KEY` | Enables live refresh of preset economics + Gemini thumbnails |
| `VITE_GEMINI_MODEL` | Default `gemini-2.0-flash` (structured cost seeds) |
| `VITE_GEMINI_IMAGE_MODEL` | Default `gemini-2.5-flash-image` (deal-profile photos) |

Without the key, presets still work from the curated mid-market library and
stock lot photos.

Vite bakes env at **build** time — change → redeploy.

---

## 3. Attach `preview.tallyctrl.com`

### In Render

1. **tally-ctrl-preview** → **Settings → Custom Domains**
2. Add **`preview.tallyctrl.com`**
3. Copy the DNS target Render shows (usually a CNAME to `*.onrender.com`)

### At your DNS host for `tallyctrl.com`

| Type | Host | Value |
| --- | --- | --- |
| CNAME | `preview` | *(Render target from step 3)* |

Wait for DNS + Render TLS (often a few minutes; can take up to an hour).

Do **not** point `tallyctrl.com` apex at this static site unless you intend that.
Keep apex / `www` for the marketing site; this subdomain is the free-tool app.

---

## 4. Cadence links

Stage-6 tokens:

```text
https://preview.tallyctrl.com/p/{token}
```

Estimator entry CTA:

```text
https://preview.tallyctrl.com/estimate
```

---

## 5. Manual create (if you skip Blueprint sync)

**New → Static Site**

| Setting | Value |
| --- | --- |
| Repo | `jpmbnyc-byte/humanweatherapp` |
| Branch | `main` |
| Root directory | `tally-ctrl` |
| Build command | `npm install && npm run build` |
| Publish directory | `dist` |

Then **Redirects/Rewrites** → Rewrite `/*` → `/index.html`.  
Then custom domain as in §3.

---

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `/estimate` 404 on refresh | SPA rewrite missing — add `/*` → `/index.html` |
| Gemini never runs | Key unset or not rebuilt after setting `VITE_*` |
| Human Weather rebuilds on every tally commit | Confirm `buildFilter.ignoredPaths` on `humanweather` includes `tally-ctrl/**` |
| Wrong app on the domain | Domain attached to `tally-ctrl-preview`, not `humanweather` |
