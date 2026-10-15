create table public.account_recovery_challenges (
  id text primary key,
  phone_e164 text not null,
  user_id uuid references auth.users(id) on delete set null,
  code_digest text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  provider_message_id text,
  created_at timestamptz not null default now()
);

alter table public.account_recovery_challenges enable row level security;
revoke all on public.account_recovery_challenges from public, anon, authenticated;
grant select, insert, update on public.account_recovery_challenges to service_role;

do $$
begin
  if not exists (
    select 1 from public.profiles where phone_verified_at is not null and phone_e164 is not null
    group by phone_e164 having count(*) > 1
  ) then
    create unique index if not exists profiles_one_verified_phone
      on public.profiles(phone_e164)
      where phone_verified_at is not null and phone_e164 is not null;
  end if;
end $$;
