create table public.anonymous_signup_phone_challenges (
  id uuid primary key,
  intent_digest text not null,
  phone_e164 text,
  code_digest text not null,
  attempts integer not null default 0 check (attempts between 0 and 5),
  sent_at timestamptz not null default now(),
  expires_at timestamptz not null,
  verified_at timestamptz,
  claimed_at timestamptz,
  claim_digest text,
  claim_expires_at timestamptz,
  consumed_at timestamptz,
  quarantined_at timestamptz,
  delivery_status text not null default 'pending'
    check (delivery_status in ('pending', 'sent', 'failed')),
  provider_message_id text,
  created_at timestamptz not null default now()
);

create index anonymous_signup_phone_intent_idx
  on public.anonymous_signup_phone_challenges(intent_digest, created_at desc);

alter table public.anonymous_signup_phone_challenges enable row level security;
revoke all on public.anonymous_signup_phone_challenges from public, anon, authenticated;
grant select, insert, update, delete on public.anonymous_signup_phone_challenges to service_role;

create or replace function public.issue_anonymous_signup_phone_challenge(
  p_id uuid,
  p_intent_digest text,
  p_phone_e164 text,
  p_code_digest text,
  p_expires_at timestamptz,
  p_provider_message_id text default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_expires_at <= now() or p_expires_at > now() + interval '5 minutes 5 seconds' then
    raise exception 'invalid_expiry';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('anonymous-signup:' || p_intent_digest, 0));
  update public.anonymous_signup_phone_challenges
    set consumed_at = now(), phone_e164 = null, code_digest = 'retired'
    where intent_digest = p_intent_digest and consumed_at is null;
  insert into public.anonymous_signup_phone_challenges(
    id, intent_digest, phone_e164, code_digest, expires_at, provider_message_id
  ) values (
    p_id, p_intent_digest, p_phone_e164, p_code_digest, p_expires_at, p_provider_message_id
  );
end;
$$;

create or replace function public.verify_anonymous_signup_phone_challenge(
  p_id uuid,
  p_intent_digest text,
  p_code_digest text
) returns text
language plpgsql security definer set search_path = public as $$
declare state public.anonymous_signup_phone_challenges%rowtype;
begin
  select * into state from public.anonymous_signup_phone_challenges
    where id = p_id and intent_digest = p_intent_digest and consumed_at is null
    for update;
  if state.id is null then return 'not_found'; end if;
  if state.expires_at <= now() then return 'expired'; end if;
  if state.attempts >= 5 then return 'attempts_exceeded'; end if;
  if state.verified_at is not null then return 'verified'; end if;
  if state.code_digest <> p_code_digest then
    update public.anonymous_signup_phone_challenges
      set attempts = attempts + 1 where id = p_id;
    return 'invalid_code';
  end if;
  update public.anonymous_signup_phone_challenges
    set verified_at = now() where id = p_id;
  return 'verified';
end;
$$;

create or replace function public.claim_anonymous_signup_phone_challenge(
  p_id uuid,
  p_intent_digest text,
  p_claim_digest text,
  p_claim_expires_at timestamptz
) returns text
language plpgsql security definer set search_path = public as $$
declare state public.anonymous_signup_phone_challenges%rowtype;
begin
  perform pg_advisory_xact_lock(hashtextextended('anonymous-signup-claim:' || p_id::text, 0));
  select * into state from public.anonymous_signup_phone_challenges
    where id = p_id and intent_digest = p_intent_digest
      and verified_at is not null and expires_at > now() and consumed_at is null
      and (claim_digest is null or claim_expires_at <= now())
    for update;
  if state.id is null then return null; end if;
  update public.anonymous_signup_phone_challenges
    set claimed_at = now(), claim_digest = p_claim_digest,
      claim_expires_at = greatest(p_claim_expires_at, state.expires_at + interval '1 second')
    where id = p_id;
  return state.phone_e164;
end;
$$;

create or replace function public.release_anonymous_signup_phone_claim(
  p_id uuid,
  p_intent_digest text,
  p_claim_digest text
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.anonymous_signup_phone_challenges
    set claimed_at = null, claim_digest = null, claim_expires_at = null
    where id = p_id and intent_digest = p_intent_digest
      and claim_digest = p_claim_digest and consumed_at is null;
  return found;
end;
$$;

create or replace function public.isolate_anonymous_signup_phone_challenge(
  p_id uuid,
  p_intent_digest text,
  p_claim_digest text
) returns boolean
language plpgsql security definer set search_path = public as $$
begin
  update public.anonymous_signup_phone_challenges
    set consumed_at = now(), quarantined_at = now(), phone_e164 = null,
      code_digest = 'isolated', provider_message_id = null,
      claim_digest = null, claim_expires_at = null
    where id = p_id and intent_digest = p_intent_digest
      and claim_digest = p_claim_digest and consumed_at is null;
  return found;
end;
$$;

create or replace function public.redact_expired_anonymous_signup_phone_challenges()
returns bigint
language plpgsql security definer set search_path = public as $$
declare redacted bigint;
begin
  update public.anonymous_signup_phone_challenges
    set phone_e164 = null, code_digest = 'expired', provider_message_id = null,
      consumed_at = coalesce(consumed_at, now()), claim_digest = null, claim_expires_at = null
    where created_at <= now() - interval '23 hours 45 minutes'
      and (phone_e164 is not null or provider_message_id is not null
        or code_digest not in ('consumed', 'isolated', 'expired'));
  get diagnostics redacted = row_count;
  return redacted;
end;
$$;

create or replace function public.finalize_verified_password_signup(
  p_user_id uuid,
  p_id uuid,
  p_intent_digest text,
  p_claim_digest text,
  p_username text,
  p_email text,
  p_display_name text,
  p_terms_version text,
  p_privacy_version text,
  p_source text default null
) returns void
language plpgsql security definer set search_path = public as $$
declare verified public.anonymous_signup_phone_challenges%rowtype;
begin
  if p_terms_version <> '2026-10-02' or p_privacy_version <> '2026-10-02' then
    raise exception 'invalid_document_version';
  end if;
  if not exists(select 1 from auth.users where id = p_user_id) then
    raise exception 'auth_user_not_found';
  end if;
  perform pg_advisory_xact_lock(hashtextextended('verified-username:' || lower(trim(p_username)), 0));
  select * into verified from public.anonymous_signup_phone_challenges
    where id = p_id and intent_digest = p_intent_digest
      and verified_at is not null and expires_at > now() and consumed_at is null
      and claim_digest = p_claim_digest and claim_expires_at > now()
    for update;
  if verified.id is null then raise exception 'phone_not_verified'; end if;
  perform pg_advisory_xact_lock(hashtextextended('verified-phone:' || verified.phone_e164, 0));
  if exists(select 1 from public.profiles where phone_e164 = verified.phone_e164
      and phone_verified_at is not null and user_id <> p_user_id) then
    raise exception 'phone_already_registered';
  end if;

  insert into public.account_usernames(user_id, username_normalized, status, activated_at)
    values(p_user_id, lower(trim(p_username)), 'active', now());
  update public.account_usernames set status = 'active', activated_at = now()
    where user_id = p_user_id;
  insert into public.profiles(user_id, display_name, email, phone_e164, phone_verified_at)
    values(p_user_id, nullif(trim(p_display_name), ''), lower(trim(p_email)), verified.phone_e164, verified.verified_at)
    on conflict(user_id) do update set display_name = excluded.display_name, email = excluded.email,
      phone_e164 = excluded.phone_e164, phone_verified_at = excluded.phone_verified_at, updated_at = now();
  insert into public.consent_acceptances(user_id, document_type, document_version, accepted) values
    (p_user_id, 'terms', p_terms_version, true),
    (p_user_id, 'privacy', p_privacy_version, true)
    on conflict(user_id, document_type, document_version) do nothing;
  if p_source = 'zipsin_check' then
    insert into public.signup_attributions(user_id, source) values(p_user_id, 'zipsin_check')
      on conflict(user_id, source) do nothing;
  end if;
  update public.anonymous_signup_phone_challenges
    set consumed_at = now(), phone_e164 = null, code_digest = 'consumed',
      provider_message_id = null, claim_digest = null, claim_expires_at = null
    where id = p_id;
end;
$$;

revoke all on function public.issue_anonymous_signup_phone_challenge(uuid,text,text,text,timestamptz,text) from public, anon, authenticated;
grant execute on function public.issue_anonymous_signup_phone_challenge(uuid,text,text,text,timestamptz,text) to service_role;
revoke all on function public.verify_anonymous_signup_phone_challenge(uuid,text,text) from public, anon, authenticated;
grant execute on function public.verify_anonymous_signup_phone_challenge(uuid,text,text) to service_role;
revoke all on function public.claim_anonymous_signup_phone_challenge(uuid,text,text,timestamptz) from public, anon, authenticated;
grant execute on function public.claim_anonymous_signup_phone_challenge(uuid,text,text,timestamptz) to service_role;
revoke all on function public.release_anonymous_signup_phone_claim(uuid,text,text) from public, anon, authenticated;
grant execute on function public.release_anonymous_signup_phone_claim(uuid,text,text) to service_role;
revoke all on function public.isolate_anonymous_signup_phone_challenge(uuid,text,text) from public, anon, authenticated;
grant execute on function public.isolate_anonymous_signup_phone_challenge(uuid,text,text) to service_role;
revoke all on function public.redact_expired_anonymous_signup_phone_challenges() from public, anon, authenticated;
grant execute on function public.redact_expired_anonymous_signup_phone_challenges() to service_role;
revoke all on function public.finalize_verified_password_signup(uuid,uuid,text,text,text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.finalize_verified_password_signup(uuid,uuid,text,text,text,text,text,text,text,text) to service_role;

create extension if not exists pg_cron;
select cron.schedule(
  'redact-anonymous-signup-phone-challenges',
  '*/15 * * * *',
  $$select public.redact_expired_anonymous_signup_phone_challenges()$$
);
