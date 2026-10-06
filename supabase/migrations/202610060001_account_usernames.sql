create extension if not exists citext;

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
