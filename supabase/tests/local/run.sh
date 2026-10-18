#!/usr/bin/env bash
# 로컬 Postgres(포트 54329)에 stub + 모든 migration을 새로 적용하고, 검사 SQL을 실행한다.
# 사용: bash supabase/tests/local/run.sh [검사.sql ...]
set -euo pipefail
cd "$(dirname "$0")/../../.."
P="psql -h ${PGHOST:-/tmp} -p ${PGPORT:-54329} -U postgres -v ON_ERROR_STOP=1 -q"
$P -c "drop database if exists zt" -c "create database zt" >/dev/null
$P -d zt -f supabase/tests/local/00_supabase_stub.sql >/dev/null 2>&1
for f in supabase/migrations/*.sql; do
  sed 's/^create extension if not exists pg_cron;$/-- (local) pg_cron stubbed/' "$f" | $P -d zt >/dev/null 2>/tmp/zt-migration.err || { echo "MIGRATION FAIL: $f"; cat /tmp/zt-migration.err; exit 1; }
done
echo "migrations: $(ls supabase/migrations/*.sql | wc -l) applied"
status=0
for t in "$@"; do
  echo "== $t"
  $P -d zt -f "$t" || status=1
done
exit $status
