alter table public.profiles
  add column usage_purpose text
  check (usage_purpose in ('tenant', 'landlord', 'broker', 'management_other'));

update public.profiles profile
set usage_purpose = case
  when role.primary_role = 'tenant' then 'tenant'
  when role.primary_role = 'landlord' then 'landlord'
  when role.primary_role in ('principal_broker', 'associate_broker', 'assistant') then 'broker'
  else null
end
from public.user_roles role
where role.user_id = profile.user_id and profile.usage_purpose is null;

alter table public.user_roles drop constraint if exists user_roles_primary_role_check;
alter table public.user_roles add constraint user_roles_primary_role_check
  check (primary_role in ('principal_broker', 'associate_broker', 'assistant', 'landlord', 'tenant'));

create or replace function public.complete_usage_onboarding(
  p_usage_purpose text,
  p_primary_role text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_usage_purpose not in ('tenant', 'landlord', 'broker', 'management_other') then
    raise exception 'invalid_purpose';
  end if;
  if (p_usage_purpose = 'tenant' and p_primary_role is distinct from 'tenant')
    or (p_usage_purpose = 'landlord' and p_primary_role is distinct from 'landlord')
    or (p_usage_purpose = 'broker' and p_primary_role not in ('principal_broker', 'associate_broker', 'assistant'))
    or (p_usage_purpose = 'management_other' and p_primary_role is not null) then
    raise exception 'invalid_role_combination';
  end if;

  perform 1 from public.profiles
  where user_id = auth.uid() and phone_verified_at is not null
  for update;
  if not found then raise exception 'signup_incomplete'; end if;

  if not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'terms' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'privacy' and document_version = '2026-10-02' and accepted
  ) or not exists (
    select 1 from public.consent_acceptances
    where user_id = auth.uid() and document_type = 'age_over_14' and document_version = '2026-10-02' and accepted
  ) then raise exception 'signup_incomplete'; end if;

  update public.profiles
  set usage_purpose = p_usage_purpose, updated_at = now()
  where user_id = auth.uid();

  if p_primary_role is null then
    delete from public.user_roles where user_id = auth.uid();
  else
    insert into public.user_roles (user_id, primary_role)
    values (auth.uid(), p_primary_role)
    on conflict (user_id) do update set
      primary_role = excluded.primary_role,
      updated_at = now();
  end if;
end;
$$;

revoke all on function public.complete_usage_onboarding(text, text) from public, anon, authenticated;
grant execute on function public.complete_usage_onboarding(text, text) to authenticated;
