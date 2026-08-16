#!/bin/bash
# Runs the real supabase/schema.sql against a throwaway local Postgres
# database and checks the security/business rules actually hold.
#
# Requires a local Postgres you can connect to (see supabase/tests/README.md
# for setup). Does NOT touch your real Supabase project -- everything here
# runs on a disposable local database.
set -u

DB="${BOOKTAU_TEST_DB:-booktau_test}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

echo "Rebuilding test database '$DB'..."
dropdb --if-exists "$DB" || { echo "Could not reach Postgres -- is it running? See supabase/tests/README.md"; exit 1; }
createdb "$DB" || exit 1

psql -d "$DB" -v ON_ERROR_STOP=1 -q -f "$SCRIPT_DIR/00_auth_shim.sql" || exit 1
psql -d "$DB" -v ON_ERROR_STOP=1 -q -f "$REPO_ROOT/supabase/schema.sql" || exit 1

# Mirror Supabase's real default: broad table grants, RLS does the actual
# restricting. (Supabase applies this automatically on managed projects;
# we have to do it by hand here.)
psql -d "$DB" -v ON_ERROR_STOP=1 -q -c "
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
" || exit 1

psql -d "$DB" -v ON_ERROR_STOP=1 -q -f "$SCRIPT_DIR/01_seed.sql" || exit 1

# A login role for the Node concurrency test (it needs a real TCP/password
# connection; the psql calls above use the local socket instead).
psql -d "$DB" -v ON_ERROR_STOP=1 -q -c "
  do \$\$ begin
    if not exists (select 1 from pg_roles where rolname = 'booktau_test_client') then
      create role booktau_test_client login password 'local-test-only';
    end if;
  end \$\$;
  grant anon to booktau_test_client;

  do \$\$ begin
    if not exists (select 1 from pg_roles where rolname = 'booktau_test_admin') then
      create role booktau_test_admin login password 'local-test-only' bypassrls;
    end if;
  end \$\$;
  grant select on all tables in schema public to booktau_test_admin;
" || exit 1

PASS=0
FAIL=0

psql_anon() {
  psql -d "$DB" -t -A -v ON_ERROR_STOP=1 -c "set role anon; $1" 2>&1
}
psql_as_owner() {
  # $1 = owner uuid, $2 = sql
  psql -d "$DB" -t -A -v ON_ERROR_STOP=1 -c "set role authenticated; set local myapp.uid = '$1'; $2" 2>&1
}
check() {
  local label="$1" expect_substr="$2" actual="$3"
  if echo "$actual" | grep -qF -- "$expect_substr"; then
    PASS=$((PASS+1)); echo "PASS: $label"
  else
    FAIL=$((FAIL+1)); echo "FAIL: $label"
    echo "  expected to contain: $expect_substr"
    echo "  actual output: $actual"
  fi
}

echo ""
echo "### Direct anonymous INSERT into bookings must be BLOCKED by RLS ###"
OUT=$(psql_anon "insert into bookings (shop_id, service_id, service_name, price, duration_minutes, booking_date, booking_time, customer_name, customer_phone) values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','Haircut',5000,30,'2026-09-07','10:00','Hacker','+77001112233');")
check "direct anon INSERT into bookings is rejected" "ERROR" "$OUT"

echo ""
echo "### Public (anon) can read shop/services/hours/blocked_dates ###"
OUT=$(psql_anon "select name from shops where slug='shop-a';")
check "anon can read shop info" "Shop A" "$OUT"

echo ""
echo "### get_shop_booking_slots() is callable by anon and returns no PII ###"
OUT=$(psql_anon "select booking_date, booking_time, duration_minutes from get_shop_booking_slots('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');")
check "get_shop_booking_slots callable by anon (no error)" "" "$OUT"

echo ""
echo "### Valid booking via create_booking() as anon SUCCEEDS ###"
OUT=$(psql_anon "select (create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','2026-09-07','10:00','Real Customer','+77001112233')).booking_time;")
check "valid booking succeeds, returns booking_time" "10:00" "$OUT"

echo ""
echo "### Cross-shop service abuse: shop A + a service belonging to shop B is REJECTED ###"
OUT=$(psql_anon "select create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','d2d2d2d2-d2d2-d2d2-d2d2-d2d2d2d2d2d2','2026-09-07','11:00','Attacker','+77001112233');")
check "service from another shop is rejected (invalid_service)" "invalid_service" "$OUT"

echo ""
echo "### Booking on a blocked date is REJECTED ###"
OUT=$(psql_anon "select create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','2026-12-25','10:00','X','+77001112233');")
check "blocked date is rejected" "blocked_date" "$OUT"

echo ""
echo "### Booking in the past is REJECTED ###"
OUT=$(psql_anon "select create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','2020-01-01','10:00','X','+77001112233');")
check "past date is rejected" "past_date" "$OUT"

echo ""
echo "### Booking outside working hours is REJECTED ###"
OUT=$(psql_anon "select create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','2026-09-07','20:00','X','+77001112233');")
check "outside working hours is rejected" "outside_hours" "$OUT"

echo ""
echo "### Sequential double-booking of the same slot is REJECTED ###"
OUT=$(psql_anon "select create_booking('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1','2026-09-07','10:00','Second Customer','+77009998877');")
check "sequential double-booking rejected (slot_taken)" "slot_taken" "$OUT"

echo ""
echo "### Ownership isolation: owner B cannot see owner A's bookings ###"
OUT=$(psql_as_owner "22222222-2222-2222-2222-222222222222" "select count(*) from bookings where shop_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';")
check "owner B sees 0 of owner A's bookings" "0" "$OUT"

echo ""
echo "### Ownership isolation: owner A can see their own booking ###"
OUT=$(psql_as_owner "11111111-1111-1111-1111-111111111111" "select count(*) from bookings where shop_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';")
check "owner A sees their own 1 booking" "1" "$OUT"

echo ""
echo "### Ownership isolation: owner B cannot update owner A's services ###"
OUT=$(psql_as_owner "22222222-2222-2222-2222-222222222222" "update services set price=1 where id='c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1'; select price from services where id='c1c1c1c1-c1c1-c1c1-c1c1-c1c1c1c1c1c1';")
check "owner B's update to owner A's service affects 0 rows (price unchanged)" "5000" "$OUT"

echo ""
echo "### Ownership isolation: owner B cannot delete owner A's booking ###"
psql_as_owner "22222222-2222-2222-2222-222222222222" "delete from bookings where shop_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';" > /dev/null
OUT=$(psql -d "$DB" -t -A -c "select count(*) from bookings where shop_id='aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';")
check "owner B's delete of owner A's booking affects 0 rows (booking survives)" "1" "$OUT"

echo ""
echo "=========================================="
echo "$PASS passed, $FAIL failed (single-request rules)"

if [ "$FAIL" -ne 0 ]; then
  echo "Skipping concurrency test since the basic rules above already failed."
  exit 1
fi

echo ""
echo "### Concurrency: two simultaneous requests for the same slot ###"
BOOKTAU_TEST_DB="$DB" node "$SCRIPT_DIR/concurrency.test.js"
