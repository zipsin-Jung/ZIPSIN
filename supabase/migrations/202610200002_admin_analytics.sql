-- 총괄 관리자 페이지 (대표 요청 2026-10-20): 집신 · 집신체크 · 집신청소 · 집신수리 방문·가입·저장·이탈을 한곳에서.
-- 원칙: 이용 통계는 사람을 알아볼 수 없게(이름·연락처·IP 저장 안 함), 180일 뒤 자동 삭제. 표는 서버(service role)만 읽고 쓴다.
begin;

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from public, anon, authenticated;

create or replace function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  occurred_at timestamptz not null default now(),
  site text not null check (site in ('zipsin', 'check', 'clean', 'repair')),
  event text not null check (event in ('page_view', 'login', 'signup_complete')),
  path text not null check (char_length(path) between 1 and 200),
  visitor_id uuid,
  session_id uuid,
  logged_in boolean not null default false
);
create index if not exists site_events_time_idx on public.site_events (occurred_at desc);
create index if not exists site_events_site_time_idx on public.site_events (site, occurred_at desc);
alter table public.site_events enable row level security;
revoke all on public.site_events from public, anon, authenticated;

create or replace function public.purge_old_site_events() returns void
language sql security definer set search_path = public as $$
  delete from public.site_events where occurred_at < now() - interval '180 days';
$$;
revoke all on function public.purge_old_site_events() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.unschedule('purge-old-site-events') where exists (select 1 from cron.job where jobname = 'purge-old-site-events');
select cron.schedule('purge-old-site-events', '17 3 * * *', $$select public.purge_old_site_events()$$);

commit;
