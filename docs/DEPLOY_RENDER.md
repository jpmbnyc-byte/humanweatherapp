# Render deployment — primary host (off Lovable)

Human Weather runs as a **Node web service** on [Render](https://render.com), with your custom domain on Namecheap.

> **Domain:** You mentioned `humanwetaher.social` — confirm the exact spelling in Namecheap before DNS setup.

---

## 1. Connect GitHub to Render

1. [Render Dashboard](https://dashboard.render.com) → **New → Web Service**
2. Connect repo: `jpmbnyc-byte/humanweatherapp`
3. Branch: `main`
4. Render can auto-detect `render.yaml` in the repo root, or set manually:

| Setting | Value |
|---------|--------|
| **Runtime** | Node |
| **Build command** | `npm install && npm run build` |
| **Start command** | `npm start` |
| **Plan** | Free (or paid for always-on) |

---

## 2. Environment variables (Render → Environment)

Copy from Stripe / your notes:

```env
NODE_VERSION=22
NITRO_PRESET=node-server

VITE_PURCHASE_URL=https://buy.stripe.com/YOUR_LINK
VITE_PURCHASE_PRICE=60
VITE_PURCHASE_PRICE_LABEL=Annual access · no monthly plan

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_ANNUAL_AMOUNT_CENTS=6000
```

Render injects `PORT` automatically — do not set it.

---

## 3. Custom domain (Namecheap)

### In Render

1. Web Service → **Settings → Custom Domains**
2. Add `humanwetaher.social`
3. Add `www.humanwetaher.social` (recommended)
4. Copy the DNS records Render shows

### In Namecheap

**Advanced DNS** for your domain:

| Type | Host | Value |
|------|------|--------|
| **CNAME** | `www` | `your-service.onrender.com` (from Render) |
| **ALIAS** or **URL Redirect** | `@` | Render apex instructions, or redirect `@` → `www` |

For apex (`humanwetaher.social` without www), Render provides an **ANAME/ALIAS** target — Namecheap supports this on some plans; otherwise redirect root to `www`.

Wait for SSL (Render provisions Let’s Encrypt automatically).

---

## 4. Stripe — point to Render (not Lovable)

Update **Stripe Dashboard** when Render + domain are live:

**Payment Link redirect:**
```text
https://humanwetaher.social/?purchase=success&session_id={CHECKOUT_SESSION_ID}
```

**Webhook:**
```text
https://humanwetaher.social/api/stripe/webhook
```

Event: `checkout.session.completed`

---

## 5. Lovable vs Render

| | Lovable | Render (primary) |
|--|---------|------------------|
| URL | `humanweatherapp.lovable.app` | `humanwetaher.social` |
| Build preset | Cloudflare (forced in Lovable) | `node-server` |
| Stripe redirect | Remove / stop using | Use this domain |
| Role | Optional editor/preview only | **Production** |

You can keep Lovable connected to GitHub for editing, but **production traffic and Stripe** should use Render.

---

## 6. Verify deploy

```bash
curl -I https://humanwetaher.social/
curl -I https://humanwetaher.social/api/stripe/webhook
```

In browser:

1. Open Field Station
2. **Get annual access** → Stripe checkout
3. Return with `?purchase=success&session_id=cs_...`
4. **Annual access active** banner appears

---

## Local production test

```bash
npm run build
PORT=3000 npm start
# open http://localhost:3000
```
