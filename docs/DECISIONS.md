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

## ADR-002: Kazakhstan data residency (pending)

**Status:** Blocked on legal counsel

**Context:** Kazakh personal data may require in-country storage. Supabase has no Kazakhstan region.

**Decision:** Do not claim compliance in privacy policy. Resolve with lawyer before marketing to KZ businesses at scale.

**Options later:** KZ-hosted Postgres, local provider, or limit market until compliant infrastructure exists.
