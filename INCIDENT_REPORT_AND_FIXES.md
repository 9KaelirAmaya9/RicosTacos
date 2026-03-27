# INCIDENT REPORT: Los Ricos Tacos Order Pipeline
Date: 2026-03-26
Severity: P1 — Revenue Impact

---

## PHASE 1 — INCIDENT REPORT

### Root Cause Hypotheses (ranked by likelihood)

1. **[CRITICAL] `STRIPE_WEBHOOK_SECRET` is EMPTY** in `supabase/functions/.env` — `constructEventAsync(body, sig, '')` will throw a signature verification error on every webhook call, meaning the webhook handler returns HTTP 400 and **never processes any payment event**. Orders stay `pending` forever and the `payment_intent.succeeded` status update to `paid` never fires.

2. **[HIGH] `OrderSuccess.tsx` has NO retry logic** — The confirmation page fetches the order exactly once immediately after redirect. If the webhook hasn't fired yet (Stripe webhooks can be delayed 1-10s), the order is still `pending` or the fetch returns nothing, and the page shows "Order Not Found" blank state.

3. **[HIGH] `send-order-notification` function requires a valid JWT `Authorization` header** but the webhook calls it with only `x-internal-call: true` (no Authorization header). The function immediately returns HTTP 401, so the notification call always fails. This is non-blocking (wrapped in try/catch) but means kitchen staff get no SMS/email notification.

4. **[MEDIUM] `STRIPE_WEBHOOK_SECRET` is also missing from Vercel production env vars** — The `.env.local` file (pulled from Vercel) has no `STRIPE_WEBHOOK_SECRET` entry. This confirms the secret is not set in production either.

5. **[MEDIUM] `SUPABASE_SERVICE_ROLE_KEY` is missing from `.env.local`** — The Supabase edge functions use `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS. This is injected automatically by Supabase at runtime for deployed functions, so this is NOT a bug for deployed functions — but confirms it's not available locally.

6. **[LOW] `checkout.session.completed` webhook handler does NOT update order status** — It only reads the order and tries to send a notification. The `payment_intent.succeeded` handler does update status to `paid`. Since the app uses PaymentIntents (not Checkout Sessions), this is the correct flow — but if `STRIPE_WEBHOOK_SECRET` is empty, neither handler runs.

### Evidence Found

- File: `supabase/functions/.env` | Issue: `STRIPE_WEBHOOK_SECRET=` is empty — webhook signature verification will fail with empty string, throwing on every Stripe event
- File: `supabase/functions/stripe-webhook/index.ts` line 40 | Issue: `webhookSecret || ''` — passes empty string to `constructEventAsync`, which throws `No signatures found matching the expected signature for payload`
- File: `src/pages/OrderSuccess.tsx` | Issue: Single fetch with no retry — if webhook hasn't fired yet, order shows as "Not Found"
- File: `supabase/functions/send-order-notification/index.ts` line 28-34 | Issue: Requires `Authorization` header, returns 401 if missing — webhook call with only `x-internal-call: true` always fails
- File: `.env.local` | Issue: Missing `STRIPE_WEBHOOK_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `VITE_STRIPE_PUBLISHABLE_KEY`
- File: `supabase/functions/stripe-webhook/index.ts` line 83-85 | Issue: `checkout.session.completed` handler does NOT update order status to `paid` — only `payment_intent.succeeded` does

### Confirmed Working

- Supabase client is a proper singleton (`src/integrations/supabase/client.ts`) — no duplicate instances
- Order INSERT uses raw `fetch()` to bypass GoTrueClient JWT refresh hangs — correct pattern
- RLS INSERT policy exists: `"Anyone can create orders"` allows `anon, authenticated` with `WITH CHECK (true)`
- Webhook uses `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS) for DB operations — correct
- Admin/Kitchen dashboards have Realtime subscriptions + 15s polling fallback — correct
- `orders` table has `paid` in CHECK constraint (migration `20260324000000`)
- Performance indexes exist on `status`, `created_at` (migration `20260325000000`)
- RLS per-row performance fix applied (migration `20260326000000`)
- Build passes clean — zero TypeScript errors

### Unknowns Requiring Testing

- Whether `STRIPE_WEBHOOK_SECRET` is set correctly in Supabase production secrets (separate from Vercel env vars)
- Whether Stripe is configured to send `payment_intent.succeeded` vs `checkout.session.completed` events to the webhook endpoint
- Whether the Supabase Realtime publication includes the `orders` table

---

## PHASE 2 — CODE FIXES APPLIED

### FIX 1: `stripe-webhook/index.ts` — Fail fast if webhook secret is missing + update status on checkout.session.completed

**Bug**: `webhookSecret || ''` silently passes empty string, causing every webhook to throw and return 400. Also, `checkout.session.completed` never updates order status to `paid`.

### FIX 2: `OrderSuccess.tsx` — Add retry polling for webhook delay

**Bug**: Single fetch with no retry. If webhook hasn't fired yet (1-10s delay), page shows "Order Not Found".

### FIX 3: `send-order-notification/index.ts` — Accept service-role internal calls

**Bug**: Requires JWT Authorization header, but webhook calls it without one. Returns 401 silently.

---

## PHASE 3 — SQL MIGRATION

See: `supabase/migrations/20260326000001_fix_order_pipeline.sql`

---

## PHASE 4 — REALITY CHECK SIGN-OFF

See bottom of this file after fixes are applied.
