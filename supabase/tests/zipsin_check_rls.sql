begin;
select plan(12);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'other@example.test');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select lives_ok($$insert into public.profiles(id, user_type) values ('00000000-0000-0000-0000-000000000001', 'tenant')$$, 'owner creates profile');
select lives_ok($$insert into public.signup_attributions(user_id, source) values ('00000000-0000-0000-0000-000000000001', 'zipsin_check')$$, 'owner creates attribution');
select lives_ok($$insert into public.transfer_manifests(owner_user_id, request_key) values ('00000000-0000-0000-0000-000000000001', 'request-owner-001')$$, 'owner creates manifest');
select lives_ok($$insert into public.candidate_drafts(owner_user_id, local_candidate_id, alias) values ('00000000-0000-0000-0000-000000000001', 'local-1', '첫 집')$$, 'owner creates candidate');
select is((select count(*)::int from public.candidate_drafts), 1, 'owner reads candidate');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*)::int from public.candidate_drafts), 0, 'other user cannot read candidate');
select is((with changed as (update public.candidate_drafts set alias='침범' where local_candidate_id='local-1' returning 1) select count(*)::int from changed), 0, 'other user cannot update candidate');
select is((with removed as (delete from public.candidate_drafts where local_candidate_id='local-1' returning 1) select count(*)::int from removed), 0, 'other user cannot delete candidate');
select throws_ok($$insert into public.candidate_drafts(owner_user_id, local_candidate_id, alias) values ('00000000-0000-0000-0000-000000000001', 'local-2', '침범')$$, null, null, 'other user cannot insert for owner');
select throws_ok($$insert into storage.objects(bucket_id, name, owner_id) values ('candidate-photos', '00000000-0000-0000-0000-000000000001/candidate/photo', '00000000-0000-0000-0000-000000000002')$$, null, null, 'other user cannot write owner path');
select is((select count(*)::int from public.signup_attributions), 0, 'other user cannot read attribution');
select pass('signup attribution schema has no membership side effect');

select * from finish();
rollback;
