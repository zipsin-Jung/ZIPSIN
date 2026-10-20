-- 관리자·이용 통계: 일반 사용자는 못 읽고 못 쓴다 (migration 202610200002)
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql
\o /dev/null
insert into public.platform_admins (user_id) values ('10000000-0000-4000-8000-000000000007');
insert into public.site_events (site, event, path, visitor_id) values ('zipsin', 'page_view', '/', gen_random_uuid());
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(public.is_platform_admin() = false, '일반 사용자: 관리자 아님');
select zt_check.expect(zt_check.try($q$select count(*) from public.site_events$q$) <> 'ok', '일반 사용자: 이용 통계 못 읽음');
select zt_check.expect(zt_check.try($q$insert into public.site_events (site, event, path) values ('zipsin', 'page_view', '/x')$q$) <> 'ok', '일반 사용자: 이용 통계 직접 못 씀');
select zt_check.expect(zt_check.try($q$insert into public.platform_admins (user_id) values ('10000000-0000-4000-8000-000000000001')$q$) <> 'ok', '스스로 관리자 못 됨');
select zt_check.as_user('10000000-0000-4000-8000-000000000007');
select zt_check.expect(public.is_platform_admin() = true, '등록된 관리자는 관리자');
reset role;
select zt_check.expect(zt_check.try($q$insert into public.site_events (site, event, path) values ('other', 'page_view', '/')$q$) <> 'ok', '모르는 사이트 거절');
select zt_check.expect((select count(*) from cron.job where jobname = 'purge-old-site-events') = 1, '180일 자동 삭제 예약');
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '관리자 검사 실패'; end if; end $$;
rollback;
