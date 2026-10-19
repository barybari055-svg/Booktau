# Booktau — Application Portfolio Notes

This document is a preparation aid for applications and interviews. It distinguishes project facts from personal contributions and unverified outcomes. Adapt any first-person statement to what you can personally explain and substantiate.

## One-line description

Booktau is an AI-assisted appointment-booking prototype for independent barbershops and salons in Kazakhstan, built to explore reliable scheduling, database-backed validation, and practical software for local businesses.

## Short application description

I initiated Booktau to explore how a simple digital booking flow could reduce appointment-scheduling friction for small service businesses in Kazakhstan. The prototype uses Next.js, Supabase, and PostgreSQL and includes an owner account/dashboard, a public booking flow, service and working-hours configuration, and database-backed booking rules. The engineering work focuses on access control, validation, concurrent requests, and safe handling of partial failures.

I used Claude for much of the implementation and test-suite work. My contribution has centered on product direction, prioritization, architectural trade-offs, review, and an end-to-end smoke test against a live Supabase project. I am continuing to strengthen my ability to independently explain and modify the code. The project is a prototype; I have not established customer adoption or commercial impact.

## Longer personal-statement starting point

I chose appointment scheduling because it connects a familiar local problem with deeper computer-science questions. A booking page looks simple, but its correctness depends on more than a polished interface: the system must enforce permissions, reject invalid requests, handle simultaneous attempts to reserve one slot, and avoid leaving partial records when an operation fails. Working on Booktau has made me more interested in the systems behind software—especially databases, concurrency, security, and reliability.

AI-assisted development helped me move from an idea to a working prototype, but it also made the distinction between generating code and understanding a system impossible to ignore. I want to use this project as a starting point for deeper study: to understand each design choice, test assumptions rather than trust appearances, and become able to implement and evaluate these systems independently.

## Evidence currently described in the repository

- JavaScript tests for availability and booking-error behavior (`npm test`).
- SQL integration suite documented in `supabase/tests/README.md`.
- A documented concurrency scenario using two simultaneous database connections and repeated attempts.
- A documented forced-failure test for transactional rollback.
- Architecture decisions and trade-offs in `docs/DECISIONS.md`.
- An end-to-end smoke test against a live Supabase project, reported by the project owner.

These are repository-documented claims. Before submitting, rerun the relevant tests and keep logs or screenshots of the actual results. Do not describe a test as passing unless you have rerun it successfully in the current version.

## Honest status and gaps

- **Prototype, not a launched business.** No verified customer adoption or revenue is claimed.
- **AI-assisted implementation.** Claude wrote most of the hands-on code and test suites. Do not claim sole authorship or independent implementation of all features.
- **Deployment and product validation:** complete only after a stable demo is available and real shop owners have tried it.
- **Privacy/data residency:** the Kazakhstan hosting/legal question is unresolved. Do not claim legal compliance or use real customer data before it is resolved.

## Interview preparation: be ready to explain

1. Why is client-side availability checking not enough to prevent double-booking?
2. What does PostgreSQL Row Level Security control, and what risks come with a `SECURITY DEFINER` function?
3. What is a race condition, and how does an advisory lock help in this design?
4. What does a database transaction guarantee during shop creation?
5. What exactly did you personally decide, test, change, or verify?
6. What did AI get wrong, and how was the problem discovered?
7. What evidence would convince you that Booktau solves a real need for shop owners?

## Next evidence to collect

- [ ] Run `npm test` and save the output.
- [ ] Run `npm run test:sql` against a disposable local PostgreSQL database and save the output.
- [ ] Run `npm run build` and record whether it passes.
- [ ] Deploy a demo only after checking that secrets are not exposed and the privacy/legal status is appropriate.
- [ ] Ask at least one shop owner to try the flow; record feedback accurately.
- [ ] Independently modify one meaningful feature and document the change and the reasoning behind it.
