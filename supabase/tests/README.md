# SQL test suite

Tests the actual rules that matter for booking integrity -- the ones that
live in `supabase/schema.sql`, not in the JS mirror in `lib/`. Runs against
a disposable local Postgres database and never touches your real Supabase
project.

It checks:
- anonymous clients can't `INSERT` into `bookings` directly (only the
  validated `create_booking()` function can)
- a service from another shop can't be used to book this shop
- blocked dates, past dates, and outside-hours bookings are rejected
- one owner can't read, update, or delete another owner's data
- **two truly simultaneous booking requests for the identical slot never
  both succeed** -- this is the one that matters most and the one that's
  easiest to get wrong

## One-time setup

You need a local Postgres you can connect to as a superuser-capable role,
plus Node's `pg` package (already in `devDependencies` -- `npm install`
picks it up).

**macOS (Homebrew):**
```
brew install postgresql@16
brew services start postgresql@16
```

**Linux (Debian/Ubuntu):**
```
sudo apt install postgresql
sudo -u postgres createuser -s "$USER"   # lets your own user create/drop test DBs
```

**Already have Postgres some other way (Docker, etc.):** just make sure
`psql`, `createdb`, and `dropdb` are on your `PATH` and point at it (set
`PGHOST`/`PGPORT`/`PGUSER` as needed).

## Running it

```
npm run test:sql
```

This rebuilds a `booktau_test` database from scratch every run (safe to
run as often as you want -- it never touches anything outside that one
database) and prints a PASS/FAIL line per rule, ending with the
concurrency test.

## Why this exists, not pgTAP or similar

This project doesn't use a Postgres-specific test framework -- just plain
`psql` calls and one Node script, matching how `lib/__tests__/` already
works (no framework there either). If the SQL layer grows enough to
justify one, that's worth a real discussion before adding the dependency.
