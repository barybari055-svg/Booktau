# Architecture & Engineering Decisions

A running log for portfolio and team context. Real problems, real tradeoffs.

---

## ADR-001: Server-side booking via Postgres RPC (2026-08-15)

**Status:** Accepted — in progress

**Context:** The public booking page inserts directly into `bookings` from the browser. RLS blocks anonymous reads of existing bookings (availability broken). Inserts accept arbitrary data with no overlap enforcement. Concurrent requests can double-book.

**Decision:** Move booking creation and public slot reads into `SECURITY DEFINER` Postgres functions (`create_booking`, `get_shop_booking_slots`). Remove direct anonymous `INSERT` on `bookings`. Enforce validation, rate limits, and overlap checks inside a single transaction with advisory locks.

**Alternatives considered:**
1. *Next.js API route + service role key* — simpler JS reuse of `getAvailableSlots`, but secrets on server and logic split across two languages.
2. *Public SELECT on bookings* — exposes customer PII (names, phones) to anyone.
3. *Exclusion constraint only* — prevents overlap but not invalid hours/blocked dates.

**Consequences:**
- Availability rules exist in both JS (UX) and SQL (security); they must stay aligned until/unless we consolidate.
- `SECURITY DEFINER` functions must validate everything explicitly — they bypass RLS.
- Timezone for “is this slot in the past?” defaults to `Asia/Almaty` until shops have their own timezone column.

**Verification:** Integration tests + manual two-tab booking attempt.

---

## ADR-002: Kazakhstan data residency (deferred, not blocked)

**Status:** Continuing on Supabase for now; revisit once legal counsel answers the open question below

**Context:** Kazakh personal data may require in-country storage under Law No. 94-V (2013) — this predates and is separate from the new provisions taking effect 2026-08-25 (breach registry, processor registry, public-data-source rules), which do not appear to touch the core storage-location requirement. Supabase has no Kazakhstan region.

**Decision:** Continue building on Supabase rather than migrating now. The schema, RLS policies, and `SECURITY DEFINER` functions (ADR-001) are standard Postgres with nothing Supabase-proprietary in them, so a later migration carries over almost all of the tested logic — deferring is low sunk-cost, not a corner being cut.

**If/when migration is needed:** self-host Supabase's own open-source stack (Postgres + Auth + PostgREST) on Kazakhstan-based infrastructure, rather than building custom auth/API from scratch. Real options exist and were confirmed, not assumed: ps.kz and Serverspace both offer VPS hosting with data centers physically in Almaty. The app code changes minimally (same client calls, different server); the real cost is taking on backups, security patching, and uptime monitoring ourselves — an ongoing operational responsibility, not a one-time task.

**Open question for counsel:** does the law require data to live *exclusively* in Kazakhstan, or does a compliant local copy/backup satisfy it with primary processing elsewhere? This determines whether the eventual path is "replace the backend" or something much lighter.

**Do not claim compliance in the privacy policy until this is resolved.**

