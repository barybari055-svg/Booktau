# Booktau

**Appointment booking for independent barbershops and salons in Kazakhstan.**

Booktau explores a simple idea: a small shop should be able to share one booking link instead of managing every appointment through a back-and-forth of messages. The project focuses on a deceptively difficult part of that experience: making sure the rules behind a booking remain correct when requests arrive at the same time.

> **Project status:** working prototype; not yet validated with real shop customers. The Kazakhstan data-residency question, production deployment, and booking notifications remain open before a commercial launch.

## Why I built it

Many small service businesses coordinate appointments manually. That can mean repeated availability questions, inconsistent working hours, and conflicting reservations. I chose this problem because it is concrete, locally relevant, and technically richer than a static website: the product must handle time, permissions, invalid requests, and simultaneous bookings correctly.

## What the prototype includes

- Shop-owner sign-up and login, with a dashboard for shop details and working hours
- A public booking flow at `/[slug]`
- Services, working hours, lunch breaks, and blocked dates
- PostgreSQL-backed booking validation and access controls
- Automated availability and booking-error tests, plus a SQL integration suite

## Engineering focus

The most important design decision is to treat the database as the final authority for booking integrity, rather than relying only on checks in the browser.

- **Access control:** Row Level Security (RLS) policies limit what clients can read or change.
- **Validated booking path:** PostgreSQL functions validate booking requests before writing them.
- **Concurrency:** an advisory lock helps serialize competing requests for the same shop and date while the slot is checked and booked.
- **Atomicity:** shop creation and its default hours are grouped so a partial failure does not leave inconsistent setup data.
- **Failure-oriented testing:** the SQL suite is designed to exercise rejected requests, owner boundaries, simultaneous booking attempts, and rollback behavior.

The repository documents the reported test scenarios and implementation decisions in [the SQL test guide](supabase/tests/README.md) and [architecture decision log](docs/DECISIONS.md). Test claims refer to the scenarios documented there; they are not a claim of production-scale reliability.

## How I used AI

This is an AI-assisted project. Claude produced most of the hands-on implementation and test-suite code. My role was to set product priorities, direct architectural decisions, review trade-offs, and personally run an end-to-end smoke test against a live Supabase project. I am continuing to build the technical understanding needed to explain, evaluate, and independently modify the system.

I include this distinction because I want the repository to show both the product I am pursuing and the way I am learning to build software responsibly—not to imply that every line was written manually by me.

## Stack

- **Application:** Next.js App Router, React
- **Data and authentication:** Supabase, PostgreSQL
- **Styling:** Tailwind CSS
- **Testing:** Node-based tests and SQL integration tests
- **CI:** GitHub Actions

## Run locally

1. Create a Supabase project.
2. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor.
3. Copy `.env.local.example` to `.env.local` and add your Supabase project URL and anon key.
4. Install dependencies and start the app:

   ```bash
   npm install
   npm run dev
   ```

5. Open `http://localhost:3000`.

Run the JavaScript tests with `npm test`. The SQL integration suite is run with `npm run test:sql`; see [its setup guide](supabase/tests/README.md) for the local PostgreSQL requirement. Use a disposable local database for the SQL tests, not a production database.

## Current limitations and next steps

- Deploy a stable demo and verify the full flow from a clean account.
- Improve visual polish and test mobile layouts.
- Ask real shop owners to try the setup and booking flow; record feedback before claiming product impact.
- Resolve the Kazakhstan data-residency question before handling real customer data commercially.
- Add booking confirmations and stronger localization after validating the core workflow.

## Project notes

- [Architecture decisions](docs/DECISIONS.md)
- [SQL test guide](supabase/tests/README.md)
- [Application portfolio notes](docs/PORTFOLIO.md)

---

Booktau is a learning and product-development project. It is not presented as a launched business, a production-certified booking system, or a product with verified customer adoption.
