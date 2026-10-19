# Booktau: Product and Validation Roadmap

This roadmap separates the current prototype from the evidence still needed before describing Booktau as a reliable commercial product.

## Current state

The repository contains a Next.js application using Supabase/PostgreSQL, owner sign-up and login, a dashboard, a public booking flow, a client-side availability helper, and a database-backed booking integrity layer. The project also includes JavaScript tests, a SQL integration suite, and a GitHub Actions workflow.

The codebase and test documentation describe work on:
- PostgreSQL Row Level Security and owner-data boundaries
- Validated booking creation and public availability queries
- Concurrent requests for the same slot
- Transactional shop setup and rollback behavior
- Error mapping for expected booking rejections

These are implementation and test-suite goals, not a guarantee of production readiness. Re-run the current tests and review the latest CI run before stating that a particular revision passes.

## Phase 1 — Verify the current prototype

**Goal:** establish a reproducible baseline before adding features.

- [ ] Run `npm ci`.
- [ ] Run `npm test` and save the output.
- [ ] Run `npm run test:sql` against a disposable local PostgreSQL database and save the output.
- [ ] Run `npm run build` and fix any build errors.
- [ ] Review the latest GitHub Actions run, including the result of every job step.
- [ ] Manually test sign-up, login, shop setup, public booking, and owner dashboard from a clean account.
- [ ] Confirm no secrets or real customer data are committed.

## Phase 2 — Make the demo understandable and usable

**Goal:** let a reviewer understand the product quickly and safely try the core flow.

- [ ] Check the landing page at mobile and desktop widths.
- [ ] Add verified screenshots of the actual application, clearly distinguishing them from illustrative previews.
- [ ] Deploy a stable demo only after reviewing environment variables, access controls, and privacy implications.
- [ ] Add concise demo instructions and known limitations to the README.
- [ ] Verify keyboard focus, contrast, form errors, loading states, and not-found behavior.

## Phase 3 — Validate the problem with real users

**Goal:** test the product hypothesis rather than assuming demand.

The current hypothesis is that small barbershops and salons in Kazakhstan would value a simple booking link if setup is quick and conflicting appointments are prevented.

- [ ] Interview several shop owners about their current scheduling process.
- [ ] Ask one or more owners to try the prototype; record what they actually do and where they get stuck.
- [ ] Measure setup time and whether a test booking can be completed without developer intervention.
- [ ] Record feedback and changes made in response.
- [ ] Claim customer adoption, usage, or impact only when supported by real evidence.

## Phase 4 — Resolve launch blockers

Before using Booktau commercially with real customer information:

- [ ] Resolve the Kazakhstan data-residency and privacy requirements with qualified advice.
- [ ] Review the privacy policy and data collection/retention practices.
- [ ] Add booking confirmations and owner notifications based on validated user needs.
- [ ] Improve Kazakh and Russian localization.
- [ ] Establish monitoring, backup, incident response, and production/staging separation.
- [ ] Reassess rate limiting and abuse controls under realistic conditions.

## Learning goals

The project is a practical opportunity to study:
- RLS and authorization boundaries
- SQL functions and transaction safety
- Race conditions, locking, and booking integrity
- Client-side versus database validation
- Time zones and scheduling rules
- Automated tests and continuous integration
- Product discovery and evidence-based iteration

## Scope discipline

Do not add billing, advanced analytics, multi-location management, or notification integrations before the core booking flow is verified and users demonstrate that these features matter. The next best step is evidence: repeatable tests, a reliable demo, and feedback from real shop owners.
