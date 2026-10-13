create extension if not exists citext;
create extension if not exists pgcrypto;

create table public.account_usernames (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username_normalized citext not null unique,
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  check (username_normalized ~ '^[a-z0-9_]{4,20}$')
);

alter table public.account_usernames enable row level security;

revoke all on public.account_usernames from anon, authenticated;
grant select, insert, update on public.account_usernames to service_role;

create or replace function public.claim_username(p_username text) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_user_id uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthorized';
  end if;

  insert into public.account_usernames (user_id, username_normalized)
  values (auth.uid(), lower(trim(p_username)))
  on conflict (username_normalized) do nothing;

  select user_id into claimed_user_id
  from public.account_usernames
  where username_normalized = lower(trim(p_username));

  return claimed_user_id = auth.uid();
end;
$$;

revoke all on function public.claim_username(text) from public;
grant execute on function public.claim_username(text) to authenticated;

create table public.auth_rate_limits (
  scope text not null,
  key_hash text not null,
  window_start timestamptz not null,
  attempts integer not null default 1 check (attempts > 0),
  primary key (scope, key_hash, window_start)
);

alter table public.auth_rate_limits enable row level security;
revoke all on public.auth_rate_limits from anon, authenticated;

create or replace function public.consume_auth_rate_limit(
  p_scope text,
  p_key text,
  p_limit integer,
  p_window_seconds integer
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  hashed_key text;
  current_window timestamptz;
  new_attempts integer;
begin
  if p_limit < 1 or p_window_seconds < 1 then
    raise exception 'invalid_rate_limit';
  end if;

  hashed_key := encode(extensions.digest(p_key, 'sha256'), 'hex');
  current_window := to_timestamp(
    floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds
  );

  insert into public.auth_rate_limits (scope, key_hash, window_start, attempts)
  values (p_scope, hashed_key, current_window, 1)
  on conflict (scope, key_hash, window_start) do update
    set attempts = public.auth_rate_limits.attempts + 1
  returning attempts into new_attempts;

  delete from public.auth_rate_limits
  where window_start < now() - interval '1 day';

  return new_attempts <= p_limit;
end;
$$;

revoke all on function public.consume_auth_rate_limit(text, text, integer, integer) from public;
grant execute on function public.consume_auth_rate_limit(text, text, integer, integer) to service_role;

create table public.auth_cleanup_queue (
  user_id uuid primary key,
  reason text not null default 'username_reservation_compensation_failed',
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

alter table public.auth_cleanup_queue enable row level security;
revoke all on public.auth_cleanup_queue from anon, authenticated;
grant select, insert, update on public.auth_cleanup_queue to service_role;
