# Booktau: Prototype → Revenue Roadmap

This document tracks how Booktau moves from its current state toward a product real businesses can pay for. Each phase lists what to learn, what to build, why it matters, how to verify it, and what to defer.

---

## Phase 0 — Current state (prototype)

**What exists today**
- Next.js app + Supabase (shops, hours, services, blocked dates, bookings)
- Owner signup, login, dashboard
- Public booking wizard at `/[slug]`
- Client-side availability engine (`lib/availability.js`)
- Partial RLS, rate limits, proxy auth on `/dashboard`

**Known P0 gaps (from audit)**
1. Public page cannot read existing bookings (RLS blocks anon `SELECT`)
2. Bookings inserted directly from browser with no server validation
3. Concurrent requests can double-book the same slot
4. Kazakhstan data residency requires a business/legal decision before KZ launch

**Assumption we are testing:** barbershops/salons in Kazakhstan will use a simple booking link if it reliably prevents double-bookings and takes under 2 minutes to set up.

**Evidence needed:** 3–5 real shop owners complete setup and receive at least one real customer booking without you fixing things manually.

---

## Phase 1 — Technically reliable MVP

**Goal:** A shop owner can share a link; customers can book; the calendar is correct under normal and abusive use.

### What you need to learn
| Topic | Why |
|---|---|
| Row Level Security (RLS) | Supabase security model — who can read/write which rows |
| `SECURITY DEFINER` functions | Server-side logic that runs with elevated privileges safely |
| Database transactions | Group checks + insert so they succeed or fail together |
| Concurrency / race conditions | Two users booking the same slot at the same millisecond |
| Client vs server validation | UI for UX; database for truth |
| Timezones | “Today” and slot cutoffs must be consistent |

### What we build (in order)
1. **Booking integrity layer** — public slot reads (no PII) + `create_booking` RPC with validation + overlap lock
2. **Automated tests** — availability unit tests (exist) + SQL/RPC integration tests + CI
3. **Error handling UX** — distinguish “slot taken”, rate limit, invalid input
4. **Signup robustness** — shop hours insert failures surfaced; one shop per owner
5. **Build/CI hygiene** — `.gitignore`, `npm test`, GitHub Actions, lazy Supabase client init
6. **Supabase E2E pass** — real project: auth, RLS, booking flow

### How we verify
- [ ] Two browser tabs cannot book the same slot
- [ ] Direct API call with wrong `service_id` is rejected
- [ ] Booking on blocked date / closed day / past time is rejected
- [ ] Public page hides slots that are already booked
- [ ] Owner still sees full booking details; public never sees customer PII from other bookings
- [ ] `npm test` and `npm run build` pass in CI

### Wait until later
- UI polish, WhatsApp, i18n, customer self-cancel portal, billing

---

## Phase 2 — Production-ready product

**Goal:** Safe to leave running for real shops without you babysitting it.

### What you need to learn
| Topic | Why |
|---|---|
| Email delivery (Supabase Auth + transactional email) | Confirmations, password reset |
| Observability | Know when bookings fail in production |
| Security headers & abuse prevention | CAPTCHA, bot traffic |
| Privacy law basics | Consent, deletion requests, breach process |
| Deployment & env management | Vercel + Supabase prod vs staging |

### What we build
1. Finalized privacy policy (real legal entity, contact, hosting region)
2. Password reset + booking confirmation email
3. CAPTCHA on public booking (after measuring abuse)
4. Monitoring (e.g. Sentry) + structured error logging
5. Staging environment + smoke tests
6. **Data residency decision** — stay on Supabase vs migrate to KZ-hosted Postgres

### How we verify
- [ ] Owner can recover account without developer help
- [ ] Customer receives confirmation email
- [ ] Errors appear in monitoring within minutes
- [ ] Legal counsel signs off on privacy/data handling for target market

### Wait until later
- Stripe billing, multi-location chains, advanced analytics

---

## Phase 3 — Real-user validation

**Goal:** Learn what businesses actually value before building pricing.

### What you need to learn
| Topic | Why |
|---|---|
| Customer discovery interviews | Avoid building for imaginary users |
| MVP scope discipline | Say no to feature requests that do not help retention |
| Onboarding metrics | Where shops drop off in the 2-minute setup |

### What we build
1. Target market focus (e.g. Almaty barbershops first — **hypothesis**)
2. Minimal onboarding improvements driven by observed drop-off
3. Kazakh + Russian UI (legal/UX requirement for KZ — not optional at scale)
4. Owner notification when a new booking arrives (SMS/email — whichever shops prefer)
5. Feedback channel (form or WhatsApp link to you)

### How we verify
| Metric | Target (hypothesis — adjust with data) |
|---|---|
| Shops that complete setup | ≥ 50% of signups |
| Shops with ≥ 1 real booking in 7 days | ≥ 30% of active shops |
| Shops still using after 30 days | ≥ 40% |
| Would pay X / month (ask directly) | ≥ 3 shops say yes at a stated price |

### Wait until later
- Automated billing, affiliate program, marketplace of shops

---

## Phase 4 — Monetization (evidence-driven)

**Goal:** Charge only after we know what shops pay for.

### What you need to learn
| Topic | Why |
|---|---|
| Pricing hypotheses vs facts | Do not guess $29/mo — ask |
| Stripe / payment integration | After willingness-to-pay is confirmed |
| SaaS unit economics | Cost per shop vs revenue per shop |

### What we build (only after Phase 3 signals)
1. Pricing experiment doc (free tier? per-booking? flat monthly?)
2. Stripe Checkout or Supabase + Stripe guide
3. Plan limits (bookings/month, shops, SMS add-on)
4. Billing admin in dashboard

### How we verify
- [ ] ≥ 1 paying shop without a personal discount
- [ ] Payment + access revocation works correctly
- [ ] Support load is manageable at current price point

---

## Engineering decision log

Major technical decisions are recorded in `docs/DECISIONS.md`.
