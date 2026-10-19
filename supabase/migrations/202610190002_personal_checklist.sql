-- 체크리스트 (대표 Figma "체크리스트", 2026-10-19): 단계별 항목을 체크하면 자동 저장.
-- 본인만 보고 본인만 바꾼다. 집과 연결은 선택(계약 전에는 집이 없을 수 있음). 집과 연결해도 다른 사람에게 보이지 않는다.
begin;

create table public.checklist_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  home_id uuid references public.homes(id) on delete restrict,
  stage text not null check (stage in ('before_contract', 'contract_day', 'before_move_in', 'after_move_in', 'living', 'before_expiry', 'move_out')),
  item_key text not null check (item_key ~ '^[a-z0-9_]{2,40}$'),
  checked_at timestamptz not null default now()
);
create unique index checklist_checks_unique on public.checklist_checks (user_id, coalesce(home_id, '00000000-0000-0000-0000-000000000000'::uuid), stage, item_key);
alter table public.checklist_checks enable row level security;
create policy "checklist_checks_select_own" on public.checklist_checks for select to authenticated using (user_id = auth.uid());
grant select on public.checklist_checks to authenticated;

-- 체크/해제. 집을 고르면 지금 그 집을 볼 수 있어야 한다.
create or replace function public.toggle_checklist_item(p_stage text, p_item_key text, p_home_id uuid, p_checked boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'permission_denied'; end if;
  if p_home_id is not null and not public.has_active_home_access(p_home_id) then raise exception 'permission_denied'; end if;
  if p_checked then
    insert into public.checklist_checks (user_id, home_id, stage, item_key) values (auth.uid(), p_home_id, p_stage, p_item_key)
    on conflict do nothing;
  else
    delete from public.checklist_checks
    where user_id = auth.uid() and stage = p_stage and item_key = p_item_key
      and coalesce(home_id, '00000000-0000-0000-0000-000000000000'::uuid) = coalesce(p_home_id, '00000000-0000-0000-0000-000000000000'::uuid);
  end if;
end;
$$;
revoke all on function public.toggle_checklist_item(text, text, uuid, boolean) from public, anon;
grant execute on function public.toggle_checklist_item(text, text, uuid, boolean) to authenticated;

commit;
