alter table public.phone_verification_states
  add column if not exists purpose text not null default 'signup' check (purpose in ('signup', 'recovery')),
  add column if not exists code_digest text not null default '',
  add column if not exists attempts integer not null default 0 check (attempts between 0 and 5),
  add column if not exists provider_message_id text,
  add column if not exists last_error_code text;

create or replace function public.issue_phone_challenge(
  p_user_id uuid,
  p_challenge_id text,
  p_phone_e164 text,
  p_code_digest text,
  p_expires_at timestamptz,
  p_provider_message_id text,
  p_purpose text default 'signup'
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_purpose not in ('signup', 'recovery') or p_expires_at > now() + interval '5 minutes 5 seconds' then
    raise exception 'invalid_challenge';
  end if;
  insert into public.phone_verification_states (
    user_id, challenge_id, phone_e164, purpose, code_digest, attempts,
    sent_at, expires_at, verified_at, consumed_at, provider_message_id, last_error_code
  ) values (
    p_user_id, p_challenge_id, p_phone_e164, p_purpose, p_code_digest, 0,
    now(), p_expires_at, null, null, p_provider_message_id, null
  ) on conflict (user_id) do update set
    challenge_id = excluded.challenge_id,
    phone_e164 = excluded.phone_e164,
    purpose = excluded.purpose,
    code_digest = excluded.code_digest,
    attempts = 0,
    sent_at = now(),
    expires_at = excluded.expires_at,
    verified_at = null,
    consumed_at = null,
    provider_message_id = excluded.provider_message_id,
    last_error_code = null;
end;
$$;

create or replace function public.verify_phone_challenge(
  p_user_id uuid,
  p_challenge_id text,
  p_code_digest text,
  p_purpose text default 'signup'
) returns text
language plpgsql security definer set search_path = public as $$
declare state public.phone_verification_states%rowtype;
begin
  select * into state from public.phone_verification_states
  where user_id = p_user_id and challenge_id = p_challenge_id and purpose = p_purpose for update;
  if state.user_id is null then return 'not_found'; end if;
  if state.consumed_at is not null then return 'used'; end if;
  if state.expires_at <= now() then return 'expired'; end if;
  if state.attempts >= 5 then return 'attempts_exceeded'; end if;
  if state.code_digest <> p_code_digest then
    update public.phone_verification_states set attempts = attempts + 1,
      last_error_code = case when attempts + 1 >= 5 then 'attempts_exceeded' else 'mismatch' end
    where user_id = p_user_id;
    if state.attempts + 1 >= 5 then return 'attempts_exceeded'; end if;
    return 'mismatch';
  end if;
  update public.phone_verification_states set verified_at = now(), last_error_code = null
  where user_id = p_user_id and challenge_id = p_challenge_id and consumed_at is null;
  return 'verified';
end;
$$;

revoke all on function public.issue_phone_challenge(uuid, text, text, text, timestamptz, text, text) from public, anon, authenticated;
revoke all on function public.verify_phone_challenge(uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.issue_phone_challenge(uuid, text, text, text, timestamptz, text, text) to service_role;
grant execute on function public.verify_phone_challenge(uuid, text, text, text) to service_role;
