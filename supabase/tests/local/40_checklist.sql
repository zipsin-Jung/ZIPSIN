-- 체크리스트: 본인만 보고 본인만 바꾼다 (migration 202610190002)
\set ON_ERROR_STOP 1
begin;
\ir 05_fixture.sql
\o /dev/null
set local role authenticated;
select zt_check.as_user('10000000-0000-4000-8000-000000000004');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('before_contract', 'registry', null, true)$q$) = 'ok', '임차인: 집 없이 계약 전 항목 체크');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('before_contract', 'registry', null, true)$q$) = 'ok', '같은 항목 두 번 체크해도 하나');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('before_move_in', 'fixed_date', '30000000-0000-4000-8000-000000000001', true)$q$) = 'ok', '임차인: 내 집에 연결해 체크');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('before_move_in', 'fixed_date', '30000000-0000-4000-8000-000000000002', true)$q$) <> 'ok', '임차인: 못 보는 집에는 체크 못 함');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('nope', 'x1', null, true)$q$) <> 'ok', '없는 단계 거절');
select zt_check.expect((select count(*) from public.checklist_checks) = 2, '내 체크 2개');
select zt_check.expect(zt_check.try($q$select public.toggle_checklist_item('before_contract', 'registry', null, false)$q$) = 'ok', '체크 해제');
select zt_check.expect((select count(*) from public.checklist_checks) = 1, '해제 뒤 1개');
select zt_check.as_user('10000000-0000-4000-8000-000000000001');
select zt_check.expect(zt_check.visible('public.checklist_checks') = 0, '사무소 대표도 임차인 체크는 못 봄');
select zt_check.as_user('10000000-0000-4000-8000-000000000005');
select zt_check.expect(zt_check.visible('public.checklist_checks') = 0, '임대인도 임차인 체크는 못 봄');
select zt_check.expect(zt_check.changed($q$delete from public.checklist_checks$q$) = 0, '남의 체크 지우기 못 함');
reset role;
\o
select n, case when ok then 'PASS' else 'FAIL' end as result, label from zt_check.results order by n;
select format('합계: %s개 중 %s개 통과', count(*), count(*) filter (where ok)) from zt_check.results;
do $$ begin if exists (select 1 from zt_check.results where not ok) then raise exception '체크리스트 검사 실패'; end if; end $$;
rollback;
