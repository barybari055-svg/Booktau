# Booktau

Small barbershops and salons in Kazakhstan mostly run booking through WhatsApp:
"Is 3pm free?" "Let me check." "Actually someone just took that." Booktau exists
to fix that specific, ordinary problem — a real booking page, with the rules a
shop actually needs (working hours, lunch breaks, no double-booking) enforced
for real, not just in a prototype.

I built this with Claude as a technical collaborator — Claude did most of the
hands-on implementation, testing, and debugging; I directed it, made the actual
product and architecture calls, and pushed back when something needed real
verification instead of a confident claim. That process is described honestly
below, not glossed over, because I think how it was built is part of the story.

**Stack:** Next.js (App Router) + Supabase (Postgres, Auth), Tailwind. Security
and booking-integrity logic lives in Postgres itself — Row Level Security
policies and `SECURITY DEFINER` functions — not in application code, so it
can't be bypassed by calling the database directly instead of going through
the app.

## Three real bugs, and how they were actually found

Anyone can claim a project is "tested." Here's what that meant concretely.

**A bug that made every error message lie.** `create_booking()` — the one
function that decides whether a booking is allowed — had a subtle PL/pgSQL
mistake: `raise exception 'slot_taken' using message = '...'` is invalid
syntax, because the literal string already sets the error message, so the
`using message =` clause tries to set it a second time. Postgres threw its
own internal error instead of the intended one. The booking was still
correctly rejected either way — but every specific reason (a slot just taken,
a blocked date, a past time) got swallowed, so a real customer would see a
generic "Something went wrong" no matter what actually happened, including
for the single most common case: someone else just took that slot. This
wasn't found by reading the code — it read fine. It was found by standing up
a real local Postgres instance and actually running every rejection path
against it, which is the only way this class of bug shows up.

**Proving concurrency safety instead of assuming it.** The harder version of
"no double-booking" isn't the easy case (one person books, then another tries
the same slot) — it's two people clicking confirm at the *same instant*. I
insisted on this being proven, not asserted: two genuinely simultaneous
database connections, racing for the identical slot, checked at the database
level afterward for whether more than one row ever existed. Five rounds, zero
double-bookings, every time. The fix underneath is a Postgres advisory lock
scoped to the shop and date, taken before the slot is checked — but the lock
existing isn't the interesting part; proving it actually works under real
concurrent load is.

**Proving atomicity by deliberately breaking it.** Shop creation used to be
two separate inserts (the shop, then its default hours) with no check that
the second one succeeded — a failure left a shop that looked created but
would show every day as permanently closed, with no way to fix it from the
dashboard. The fix bundles both into one database transaction. To confirm
that actually works rather than just looking right, we forced a failure
partway through the hours insert on purpose (a temporary trigger, removed
right after) and confirmed the *entire* operation rolled back — no orphaned
shop, no partial data. Then built a recovery path for any shop that already
existed in that broken state before the fix.

## How the collaboration actually worked

The direction, priorities, and real tradeoff calls were mine. Specific
examples, not a vague claim: insisting from the start that nothing gets
called "fixed" without being run against a real database, not just read;
deciding to stay on Supabase now and defer a Kazakhstan-hosting migration
until there's a real legal answer, once we'd confirmed the underlying schema
is portable enough that deferring isn't a real cost; choosing to drop
SMS/Twilio work once it wasn't essential to the actual goal; personally
running the end-to-end smoke test against a real, live Supabase project
myself and reporting back exactly what happened, since that's the one thing
Claude structurally can't do from its own sandbox; redirecting the whole
project's priorities when the goal shifted from a commercial launch to this
application.

Claude wrote the majority of the actual code, designed the test suites, found
the bugs above, and — genuinely worth including, not hiding — made real
mistakes along the way and caught them: merged a pull request once without
noticing its CI check had actually failed (a polling script checked whether
a run had *finished*, not whether it had *passed*), caught it, and fixed the
actual root cause rather than just re-running and hoping.

## What's honestly not done

- **Visual polish.** The logic is solid; the styling is still close to
  default Tailwind. A real design pass is next.
- **The Kazakhstan data-residency legal question**, recorded in
  `docs/DECISIONS.md` rather than resolved — Supabase has no Kazakhstan
  region, and Kazakh law may require one for real customer data. Deliberately
  deferred, not ignored, since the underlying schema is confirmed portable.
- **Booking confirmations (SMS/WhatsApp) and deep localization** — both real
  requirements for an eventual commercial launch, both correctly out of scope
  for this specific goal right now.

## Setup (about 15 minutes)

1. Create a free project at **supabase.com**.
2. In the Supabase dashboard's **SQL Editor**, paste in and run
   `supabase/schema.sql` — creates every table, RLS policy, and the secure
   booking functions in one pass.
3. In **Settings → API**, copy the **Project URL** and **anon public key**
   into a new `.env.local` (copy `.env.local.example` as a starting point).
4. `npm install && npm run dev`, then open `localhost:3000` and create a real
   shop through the actual sign-up flow.

Before touching `create_booking()` or the RLS policies again: `npm run
test:sql` (needs a local Postgres — see `supabase/tests/README.md`) runs the
real rule suite, including the concurrency test, directly against
`schema.sql`.

## Deploying for real

1. Push to GitHub (already done here).
2. Import into **Vercel** — zero config needed for a standard Next.js app.
3. Add the same two environment variables in Vercel's project settings.
4. Deploy. The free `.vercel.app` URL is genuinely fine to use as-is.

## Next steps, roughly in order

The current goal is making this presentable for a college application, not
continuing toward a commercial launch — this list reflects that, not the
longer-term commercial roadmap.

1. Get a real deployment live — everything else benefits from having
   something real to point to.
2. A visual polish pass.
3. If realistic, get one real shop owner to actually try it — a real user is
   a stronger story than any amount of additional polish.

Deliberately not on this list right now, though genuinely important for an
eventual real launch: the Kazakhstan data-residency question, WhatsApp/SMS
confirmations, and deep localization.
