# Booktau — starter app

A real, deployable version of Booktau: a Next.js app backed by a Supabase database.
This is meant to replace the Claude-chat demo once you're ready to actually launch —
same booking rules, real data, a URL you can actually send people.

## What's included in this version

- Database schema for shops, hours, services, blocked dates, and bookings —
  owner accounts tied to Supabase Auth, with collision-safe slugs
- The exact availability logic from the demo: working hours, lunch breaks, blocked
  days, no double-booking, no offering a slot that would run past closing
- The public customer booking page at `/your-shop-slug`
- **Sign-up** (`/signup`): creates a real account, a shop, and default hours in one
  flow — this is the actual "under 2 minutes, no one touches the database by hand"
  path. If two shops would simplify to the same link, the second one automatically
  gets `-2`, `-3`, etc. appended instead of failing.
- **Login** (`/login`) and a full **dashboard** (`/dashboard`): booking link,
  upcoming bookings with cancellation, services, and working hours / days off —
  all editable from the app, no database access required after initial setup.
- **Server-side route protection.** `/dashboard` is now gated by a proxy (Next.js
  16's replacement for middleware) that checks the session before any dashboard
  code is sent to the browser, rather than the page checking client-side after
  loading. Two real bugs surfaced building this, both fixed and verified: Next.js
  16 silently ignores a file still named `middleware.js` — no error, it just
  doesn't run — so this had to specifically be `proxy.js` exporting a `proxy`
  function. And the auth check itself (`getClaims()`) can return a shape that
  crashes a naive destructure when it can't reach Supabase at all, which needed
  defensive handling so a network hiccup fails safe instead of 500ing. Verified
  with actual HTTP requests against the built app, not just a successful build:
  an unauthenticated request to `/dashboard` gets a real 307 to `/login`, while
  `/`, `/login`, and public shop pages load normally, untouched by the check.
- If a shop somehow never got created after an account did (a failed save, an
  interrupted sign-up), the dashboard offers an inline "finish setting up" step
  instead of sending you back to a sign-up form that would reject your
  already-registered email.
- The public booking endpoint is rate-limited at the database level: no more than
  20 bookings per shop or 5 per phone number in a 10-minute window. This applies
  no matter what calls it — not just this app's UI, but any direct API request —
  since it's enforced in Postgres itself. Caught and fixed a real bug while
  building this: the first version caused "infinite recursion" errors that would
  have broken booking for everyone, not just abusive requests. Full story in the
  schema comments if you're curious; the short version is a policy that queries
  its own table has to do it through a function that bypasses RLS internally, or
  it re-triggers itself forever.

- **A privacy policy page** (`/privacy`) and real consent checkboxes — both the
  sign-up form and the customer booking form now require checking a box, linked
  to the policy, before proceeding. This isn't just documentation; the booking
  and sign-up buttons are disabled until it's checked.

## Before you launch this for real — read this one

While drafting the privacy policy, I checked what Kazakhstan's actual legal
requirements are rather than writing generic boilerplate, and found something
more important than the policy text itself: **Kazakhstan law requires personal
data of Kazakhstani citizens to be stored on servers physically located within
Kazakhstan.** Supabase does not offer a Kazakhstan region. That means the
database this entire app is built on may not be compliant for real Kazakh
customers, independent of anything the privacy policy says.

This isn't a minor formality — fines run up to roughly 5,000 MCI (~$42,500), with
criminal liability for major leaks, and a significant round of amendments to this
exact law takes effect **25 August 2026**. I'm not a lawyer, and this area is
visibly changing right now — get a real Kazakhstan lawyer to confirm how this
applies to your specific setup before onboarding real paying shops. The privacy
policy at `/privacy` has this flagged inline (section 4) rather than asserting
compliance I can't verify. Everything else about consent and data handling in
this app was built assuming you'll resolve this first.

## What a full recheck pass found

Asked to re-verify everything already built, not just the newest piece — this
found one real bug and closed several testing gaps:

- **Real bug, now fixed:** every "what's today" calculation in the app (the
  availability engine, the booking page's date picker minimum, the dashboard's
  upcoming-bookings filter) used `new Date().toISOString().slice(0,10)`, which
  converts to UTC first. For Kazakhstan (UTC+5/+6), that silently returns
  *yesterday's* date during the early-morning local hours — proven concretely: at
  2am in Almaty, it returned 2026-08-15 instead of 2026-08-16. Fixed with a
  `localDateStr()` helper that reads local calendar components instead, and
  applied everywhere the old pattern was copied.
- The core availability engine (`lib/availability.js`) now has a real test suite
  at `lib/__tests__/availability.test.mjs` — 10 cases covering lunch-break
  boundaries, closed days, durations that would run past closing, double-booking
  prevention, and past-time filtering, run under Kazakhstan's actual timezone.
  Run it yourself anytime with `TZ='Asia/Almaty' node lib/__tests__/availability.test.mjs`
  after touching that file.
- Ownership isolation was previously verified for `shops` and `bookings` only.
  This pass extended the same real-Postgres testing to `shop_hours`, `services`,
  and `blocked_dates`: confirmed a second owner's writes to any of these silently
  affect 0 rows, inserts into someone else's shop are rejected outright, public
  read access still works, and public write attempts are blocked — with a final
  check that none of the attempted attacks actually changed anything.
- The booking-cancellation delete policy (what the dashboard's cancel button
  depends on) had never been tested in isolation — confirmed a non-owner's
  cancel attempt does nothing and the booking survives, while the rightful
  owner's cancel succeeds.

## What's NOT included yet — the honest list

- **The polished visual design** from the chat demo. This version is functional but
  plain on purpose — restyling to match is easy once the data layer is proven.
- **Real WhatsApp messages.** Still needs a Meta Business API or Twilio account —
  that part can't be set up by anyone but you, since it requires your own business
  verification.
- **Phone number verification** for the customer-lookup flow, if you bring that
  feature over from the demo. Right now anyone entering a phone number could see
  bookings under it — fine while testing, not fine once real customers are in there.

One more honest note on what's actually been tested versus just checked by reading:
the Next.js app builds with zero errors, the database schema — including the RLS
policies — has been run against a real local Postgres instance, and the proxy's
redirect behavior has been checked with actual HTTP requests against the running
built app, not just inferred from a successful build. That combination is how the
rate-limit recursion bug and the proxy crash-on-network-error bug above both got
caught before shipping. What hasn't happened is running this against an actual
Supabase project specifically (this sandbox can't reach supabase.co), so
Supabase-specific behavior (its exact auth session handling, connection pooling,
etc.) is still worth testing once you're set up for real. Watch for one specific
thing: if your Supabase project has "Confirm email" turned on (the default for new
projects), a brand-new sign-up won't get an active session until they click the
email link. The code handles that case, but it's worth knowing before you wonder why
the first sign-up you try doesn't drop you straight into the dashboard.

## Setup (about 15 minutes)

1. Create a free project at **supabase.com** — no credit card needed.
2. In the Supabase dashboard, go to **SQL Editor**, paste in the contents of
   `supabase/schema.sql`, and run it. This creates all five tables, the
   auth-aware access rules, and the secure booking functions.
   If you already ran an older version of the schema, run
   `supabase/migrations/001_booking_integrity.sql` instead to upgrade.
3. (Optional, for faster testing) In **Authentication → Settings**, turn off
   "Confirm email" so new sign-ups get an active session immediately instead of
   waiting on an email link. Turn it back on before real customers sign up.
4. In Supabase, go to **Settings → API** and copy the **Project URL** and
   **anon public key**.
5. Rename `.env.local.example` to `.env.local` and paste those two values in.
6. Install and run:
   ```
   npm install
   npm run dev
   ```
7. Open `localhost:3000`, click **Create your shop**, fill in the form — that's a
   real account and a real shop, created through the app itself, no database
   editing required.
8. From the dashboard, add a service or two, then open `/your-slug` in another
   tab and book something. Check the `bookings` table in Supabase — it's actually
   there.

## Deploying for real

1. Push this folder to a GitHub repo.
2. Import it into **Vercel** (free tier is enough to start) — it auto-detects
   Next.js with zero config.
3. Add the same two environment variables in Vercel's project settings.
4. Buy a domain (or use the free `.vercel.app` one to start) and point it at
   the Vercel project. Now `/your-slug` is live for anyone, not just you.

## Suggested next steps, roughly in order

1. Resolve the data residency question above with real legal counsel — this
   affects the database choice itself, so it's worth settling before much more
   gets built on top of the current setup.
2. Port the visual design from the chat demo — the logic underneath is identical,
   so this is styling work, not rebuilding.
3. Add the WhatsApp confirmation for real, once you have API access.
4. Bring back language switching (English/Russian/Kazakh) — same translation
   strings as the demo, just wired to a real settings table instead of local
   state. Worth noting: Kazakhstan's digital business rules require services to
   be available in Kazakh and Russian, not just as a nice-to-have.
5. Add phone verification (SMS/WhatsApp OTP) before letting anyone look up or
   cancel a booking by phone number.
# Booktau
# Booktau
# Booktau
