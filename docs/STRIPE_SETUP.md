# Stripe setup — Human Weather annual access ($60/year)

Human Weather uses **Stripe Payment Links** for a **one-time $60 annual access** charge (no monthly subscription). After payment, the app verifies the checkout session server-side and unlocks **365 days** on the device.

## 1. Create the Stripe product

In [Stripe Dashboard](https://dashboard.stripe.com):

1. **Product catalog → Add product**
2. Name: `Human Weather — Annual Access`
3. Price: **$60.00 USD**, **One time** (not recurring)
4. Save the product

## 2. Create a Payment Link

1. **Payment links → Create link**
2. Select the $60 one-time product
3. Under **After payment** → **Redirect to a URL**
4. Set the redirect URL to (replace domain):

```text
https://YOUR-LIVE-DOMAIN/?purchase=success&session_id={CHECKOUT_SESSION_ID}
```

Example for production on Render:

```text
https://humanweather.social/?purchase=success&session_id={CHECKOUT_SESSION_ID}
```

(Use your exact Namecheap domain. While testing on Lovable preview only, use `https://humanweatherapp.lovable.app/...` temporarily.)

Copy the Payment Link URL:

```text
https://buy.stripe.com/5kQ28r28T8OY9s56G34ow00
```

(Wired in `render.yaml` and `.env.example`.)

## 3. Environment variables

Add in **Render → Environment** (primary) or Lovable env (preview only):

| Variable | Where | Example |
|----------|--------|---------|
| `VITE_PURCHASE_URL` | Client | `https://buy.stripe.com/5kQ28r28T8OY9s56G34ow00` |
| `VITE_PURCHASE_PRICE` | Client | `60` |
| `VITE_PURCHASE_PRICE_LABEL` | Client | `Annual access · no monthly plan` |
| `STRIPE_SECRET_KEY` | Server only | `sk_live_...` or `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Server only | `whsec_...` |
| `STRIPE_ANNUAL_AMOUNT_CENTS` | Server optional | `6000` (default) |

Redeploy after saving env vars.

## 4. Webhook (recommended)

1. **Developers → Webhooks → Add endpoint**
2. URL:

```text
https://humanweather.social/api/stripe/webhook
```

Full Render setup: see `docs/DEPLOY_RENDER.md`.

3. Events: `checkout.session.completed`
4. Copy the **Signing secret** → `STRIPE_WEBHOOK_SECRET`

The webhook logs completed checkouts. Access is granted when the user returns to the app with a verified `session_id`.

## 5. Test flow

1. Use Stripe **test mode** keys and a test Payment Link
2. Open the app → **Get annual access**
3. Pay with test card `4242 4242 4242 4242`
4. You should land on `?purchase=success&session_id=cs_test_...`
5. App shows **Annual access active** with expiry ~1 year out
6. Marked days, forming, offices, and prescriptions unlock

## What the code does

| Piece | Role |
|-------|------|
| `purchaseConfig.ts` | Opens Payment Link; documents redirect template |
| `stripe.server.ts` | Verifies session is paid, $60+, not a subscription |
| `stripe.functions.ts` | Server function called from browser after redirect |
| `EntitlementContext.tsx` | Grants 365 days only after verification |
| `api/stripe/webhook.ts` | Receives Stripe webhook events |

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Purchase button disabled | Set `VITE_PURCHASE_URL` and redeploy |
| "Payment not verified" | Check `STRIPE_SECRET_KEY` on server; confirm redirect includes `{CHECKOUT_SESSION_ID}` |
| "Missing session id" | Fix Payment Link redirect URL (step 2) |
| Amount mismatch | Ensure product is $60 or set `STRIPE_ANNUAL_AMOUNT_CENTS` |
