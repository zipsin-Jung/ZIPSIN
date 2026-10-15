create table if not exists public.auth_sms_send_events (
  id bigint generated always as identity primary key,
  scope text not null,
  key_digest text not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_sms_send_events_lookup on public.auth_sms_send_events(scope, key_digest, created_at desc);
alter table public.auth_sms_send_events enable row level security;
revoke all on public.auth_sms_send_events from public, anon, authenticated;
grant select, insert, delete on public.auth_sms_send_events to service_role;

create or replace function public.reserve_auth_sms_send(
  p_scope text, p_key_digest text, p_min_interval_seconds integer,
  p_hour_limit integer, p_day_limit integer
) returns boolean language plpgsql security definer set search_path = public as $$
declare last_sent timestamptz; hour_count integer; day_count integer;
begin
  perform pg_advisory_xact_lock(hashtextextended(p_scope || ':' || p_key_digest, 0));
  delete from public.auth_sms_send_events where created_at < now() - interval '25 hours';
  select max(created_at), count(*) filter (where created_at > now() - interval '1 hour'),
    count(*) filter (where created_at > now() - interval '24 hours')
    into last_sent, hour_count, day_count from public.auth_sms_send_events
    where scope = p_scope and key_digest = p_key_digest;
  if last_sent is not null and last_sent > now() - make_interval(secs => p_min_interval_seconds) then return false; end if;
  if hour_count >= p_hour_limit or day_count >= p_day_limit then return false; end if;
  insert into public.auth_sms_send_events(scope, key_digest) values (p_scope, p_key_digest);
  return true;
end; $$;

revoke all on function public.reserve_auth_sms_send(text,text,integer,integer,integer) from public, anon, authenticated;
grant execute on function public.reserve_auth_sms_send(text,text,integer,integer,integer) to service_role;

create or replace function public.issue_account_recovery_challenge(
  p_id text, p_phone_e164 text, p_user_id uuid, p_code_digest text, p_expires_at timestamptz
) returns void language plpgsql security definer set search_path = public as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('recovery:' || p_phone_e164, 0));
  update public.account_recovery_challenges set consumed_at = now()
    where phone_e164 = p_phone_e164 and consumed_at is null;
  insert into public.account_recovery_challenges(id, phone_e164, user_id, code_digest, expires_at)
    values (p_id, p_phone_e164, p_user_id, p_code_digest, p_expires_at);
end; $$;

create or replace function public.verify_account_recovery_challenge(
  p_id text, p_code_digest text
) returns table(status text, user_id uuid) language plpgsql security definer set search_path = public as $$
declare state public.account_recovery_challenges%rowtype;
begin
  select * into state from public.account_recovery_challenges where id = p_id for update;
  if state.id is null then return query select 'not_found'::text, null::uuid; return; end if;
  if state.consumed_at is not null then return query select 'used'::text, null::uuid; return; end if;
  if state.expires_at <= now() then return query select 'expired'::text, null::uuid; return; end if;
  if state.attempts >= 5 then return query select 'attempts_exceeded'::text, null::uuid; return; end if;
  if state.code_digest <> p_code_digest then
    update public.account_recovery_challenges set attempts = attempts + 1 where id = p_id;
    return query select case when state.attempts + 1 >= 5 then 'attempts_exceeded' else 'mismatch' end::text, null::uuid; return;
  end if;
  update public.account_recovery_challenges set consumed_at = now() where id = p_id;
  return query select 'verified'::text, state.user_id; return;
end; $$;
revoke all on function public.issue_account_recovery_challenge(text,text,uuid,text,timestamptz) from public, anon, authenticated;
revoke all on function public.verify_account_recovery_challenge(text,text) from public, anon, authenticated;
grant execute on function public.issue_account_recovery_challenge(text,text,uuid,text,timestamptz) to service_role;
grant execute on function public.verify_account_recovery_challenge(text,text) to service_role;

create table if not exists public.account_recovery_sessions (
  token_digest text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null, consumed_at timestamptz, created_at timestamptz not null default now()
);
alter table public.account_recovery_sessions enable row level security;
revoke all on public.account_recovery_sessions from public, anon, authenticated;
grant select, insert, update on public.account_recovery_sessions to service_role;
create or replace function public.consume_account_recovery_session(p_token_digest text)
returns uuid language plpgsql security definer set search_path = public as $$
declare session_user uuid;
begin
  select user_id into session_user from public.account_recovery_sessions
    where token_digest = p_token_digest and consumed_at is null and expires_at > now() for update;
  if session_user is null then return null; end if;
  update public.account_recovery_sessions set consumed_at = now() where token_digest = p_token_digest;
  return session_user;
end; $$;
revoke all on function public.consume_account_recovery_session(text) from public, anon, authenticated;
grant execute on function public.consume_account_recovery_session(text) to service_role;

create or replace function public.account_has_verified_phone(p_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.profiles where user_id = p_user_id and phone_verified_at is not null)
$$;
revoke all on function public.account_has_verified_phone(uuid) from public, anon;
grant execute on function public.account_has_verified_phone(uuid) to authenticated, service_role;

create or replace function public.set_primary_role(p_primary_role text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_primary_role not in ('principal_broker','assistant','landlord','tenant') then raise exception 'invalid_role'; end if;
  if not public.account_has_verified_phone(auth.uid())
    or not exists(select 1 from public.consent_acceptances where user_id=auth.uid() and document_type='terms' and accepted)
    or not exists(select 1 from public.consent_acceptances where user_id=auth.uid() and document_type='privacy' and accepted)
  then raise exception 'signup_incomplete'; end if;
  insert into public.user_roles(user_id,primary_role) values(auth.uid(),p_primary_role)
    on conflict(user_id) do update set primary_role=excluded.primary_role,updated_at=now();
end; $$;

create or replace function public.complete_check_onboarding(p_user_type text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  if not public.account_has_verified_phone(auth.uid()) then raise exception 'phone_verification_required'; end if;
  if p_user_type not in ('house_hunter', 'tenant') then raise exception 'invalid_user_type'; end if;
  update public.profiles set user_type=p_user_type,onboarding_state='complete',updated_at=now() where user_id=auth.uid();
  insert into public.signup_attributions(user_id,source) values(auth.uid(),'zipsin_check') on conflict do nothing;
end; $$;

drop policy if exists "candidate_photos_owner_select" on storage.objects;
create policy "candidate_photos_owner_select" on storage.objects for select using (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "candidate_photos_owner_insert" on storage.objects;
create policy "candidate_photos_owner_insert" on storage.objects for insert with check (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text
  and array_length(storage.foldername(name),1)=2 and exists(select 1 from public.candidate_drafts d where d.id::text=(storage.foldername(name))[2] and d.owner_user_id=auth.uid()));
drop policy if exists "candidate_photos_owner_update" on storage.objects;
create policy "candidate_photos_owner_update" on storage.objects for update
  using (bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text)
  with check (bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "candidate_photos_owner_delete" on storage.objects;
create policy "candidate_photos_owner_delete" on storage.objects for delete using (
  bucket_id='candidate-photos' and public.account_has_verified_phone(auth.uid()) and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "manifests_owner_all" on public.transfer_manifests;
create policy "manifests_owner_all" on public.transfer_manifests for all
  using (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()))
  with check (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()));
drop policy if exists "drafts_owner_all" on public.candidate_drafts;
create policy "drafts_owner_all" on public.candidate_drafts for all
  using (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()))
  with check (owner_user_id=auth.uid() and public.account_has_verified_phone(auth.uid()));
drop policy if exists "answers_owner_all" on public.candidate_answers;
create policy "answers_owner_all" on public.candidate_answers for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()));
drop policy if exists "photos_owner_all" on public.candidate_photos;
create policy "photos_owner_all" on public.candidate_photos for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.candidate_drafts d where d.id=candidate_id and d.owner_user_id=auth.uid()));
drop policy if exists "transfer_items_owner_all" on public.transfer_items;
create policy "transfer_items_owner_all" on public.transfer_items for all
  using (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.transfer_manifests m where m.id=manifest_id and m.owner_user_id=auth.uid()))
  with check (public.account_has_verified_phone(auth.uid()) and exists(select 1 from public.transfer_manifests m where m.id=manifest_id and m.owner_user_id=auth.uid()));

create or replace function public.complete_signup(
  p_display_name text, p_email text, p_challenge_id text, p_terms_version text,
  p_privacy_version text, p_marketing_sms boolean, p_marketing_email boolean
) returns void language plpgsql security definer set search_path = public as $$
declare verified public.phone_verification_states%rowtype;
begin
  if p_terms_version <> '2026-10-02' or p_privacy_version <> '2026-10-02' then raise exception 'invalid_document_version'; end if;
  select * into verified from public.phone_verification_states where user_id=auth.uid() and challenge_id=p_challenge_id
    and verified_at is not null and expires_at>now() and consumed_at is null for update;
  if verified.user_id is null then raise exception 'phone_not_verified'; end if;
  perform pg_advisory_xact_lock(hashtextextended('verified-phone:' || verified.phone_e164, 0));
  if exists(select 1 from public.profiles where phone_e164=verified.phone_e164 and phone_verified_at is not null and user_id<>auth.uid())
  then raise exception 'phone_already_registered'; end if;
  update public.phone_verification_states set consumed_at=now() where user_id=auth.uid() and challenge_id=p_challenge_id;
  insert into public.profiles(user_id,display_name,email,phone_e164,phone_verified_at)
    values(auth.uid(),p_display_name,p_email,verified.phone_e164,verified.verified_at)
    on conflict(user_id) do update set display_name=excluded.display_name,email=excluded.email,phone_e164=excluded.phone_e164,phone_verified_at=excluded.phone_verified_at,updated_at=now();
  insert into public.consent_acceptances(user_id,document_type,document_version,accepted) values
    (auth.uid(),'terms',p_terms_version,true),(auth.uid(),'privacy',p_privacy_version,true),
    (auth.uid(),'marketing_sms',p_terms_version,p_marketing_sms),(auth.uid(),'marketing_email',p_terms_version,p_marketing_email)
    on conflict(user_id,document_type,document_version) do nothing;
end; $$;
