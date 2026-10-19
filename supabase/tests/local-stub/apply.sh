#!/bin/bash
# 로컬 Postgres(실제 Supabase 아님)에 스텁 + 전체 migration을 올린다. 예: PGHOST=/tmp/pgclean PGPORT=54329 apply.sh clean_test
# 운영·Preview DB에 쓰지 않는다.
# 사용: apply.sh DB이름  — 스텁 + 모든 migration(로컬 검사용)
set -e
DB=$1; H="-h ${PGHOST:-/tmp/pgclean} -p ${PGPORT:-54329} -U ${PGUSER:-postgres}"
dropdb $H --if-exists $DB; createdb $H $DB
psql -q $H -d $DB -v ON_ERROR_STOP=1 -f "$(dirname $0)/supabase_stub.sql" 2>/dev/null
for f in $(cd "$(dirname $0)/../../migrations" && pwd)/*.sql; do
  sed 's/^create extension if not exists pg_cron;//' "$f" | psql -q $H -d $DB -v ON_ERROR_STOP=1 >/dev/null 2>/tmp/clean-migrate-err.txt || { echo "FAIL $(basename $f)"; head -4 /tmp/clean-migrate-err.txt; exit 1; }
done
echo "applied $(ls $(cd "$(dirname $0)/../../migrations" && pwd)/*.sql | wc -l) migrations"
