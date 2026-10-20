import 'server-only';
import { createUntypedAdminClient } from '@/lib/supabase/admin';
import { aggregateEvents, type EventRow } from '@/features/admin/aggregate';

/* v8 ignore start -- service-role DB boundary; numbers are computed by aggregate.ts (unit-tested). */
/**
 * 총괄 관리자 대시보드 데이터. 서버에서 service role로 읽는다(관리자 확인을 통과한 요청만 여기까지 온다).
 * 개인 기록 내용은 읽지 않고 '몇 개인지'만 센다.
 */
export async function loadAdminDashboard(days: number) {
  const admin = createUntypedAdminClient();
  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const count = async (table: string, apply?: (query: ReturnType<ReturnType<typeof admin.from>['select']>) => unknown) => {
    let query = admin.from(table).select('*', { count: 'exact', head: true });
    if (apply) query = apply(query) as typeof query;
    const { count: value, error } = await query;
    return error ? null : value ?? 0;
  };
  const both = async (table: string, extra?: (query: ReturnType<ReturnType<typeof admin.from>['select']>) => unknown) => {
    const [total, recent] = await Promise.all([
      count(table, extra),
      count(table, (query) => { const base = extra ? extra(query) as typeof query : query; return base.gte('created_at', since); }),
    ]);
    return { total, recent };
  };

  const [eventsResult, users, homes, photos, documents, notes, repairs, receipts, attachments, inspections, checklist, contacts, partners, partnersWaiting, chats, checkCandidates, homeCreators, recordCreators, candidateOwners] = await Promise.all([
    admin.from('site_events').select('site, event, path, visitor_id, session_id, occurred_at').gte('occurred_at', since).order('occurred_at', { ascending: true }).limit(50_000),
    both('profiles'),
    both('homes'),
    both('records', (query) => query.eq('record_kind', 'photo')),
    both('records', (query) => query.eq('record_kind', 'document')),
    both('records', (query) => query.eq('record_kind', 'note')),
    both('records', (query) => query.eq('record_kind', 'repair')),
    both('records', (query) => query.eq('record_kind', 'repair').eq('repair_stage', 'receipt_attached')),
    both('attachments', (query) => query.eq('status', 'ready')),
    both('home_inspections'),
    count('checklist_checks').then((total) => ({ total, recent: null as number | null })),
    both('home_contacts'),
    both('partner_applications'),
    count('partner_applications', (query) => query.eq('status', 'submitted')),
    both('chat_messages'),
    both('candidate_drafts'),
    admin.from('homes').select('created_by').gte('created_at', since).limit(10_000),
    admin.from('records').select('created_by').gte('created_at', since).limit(20_000),
    admin.from('candidate_drafts').select('owner_user_id').gte('created_at', since).limit(10_000),
  ]);

  const events = (eventsResult.data ?? []) as EventRow[];
  const summary = aggregateEvents(events);
  const distinct = (rows: Array<Record<string, string>> | null, key: string) => new Set((rows ?? []).map((row) => row[key])).size;

  return {
    days,
    eventsAvailable: !eventsResult.error,
    summary,
    users,
    data: [
      { label: '집', site: 'zipsin', ...homes },
      { label: '사진 기록', site: 'zipsin', ...photos },
      { label: '계약서·서류', site: 'zipsin', ...documents },
      { label: '메모', site: 'zipsin', ...notes },
      { label: '수리', site: 'zipsin', ...repairs },
      { label: '영수증까지 끝난 수리', site: 'zipsin', ...receipts },
      { label: '올린 파일', site: 'zipsin', ...attachments },
      { label: '입주·퇴거 상태 기록', site: 'zipsin', ...inspections },
      { label: '체크리스트 체크', site: 'zipsin', ...checklist },
      { label: '주소록', site: 'zipsin', ...contacts },
      { label: '대화 메시지', site: 'zipsin', ...chats },
      { label: '파트너 신청', site: 'zipsin', ...partners },
      { label: '집신체크 저장한 후보 집', site: 'check', ...checkCandidates },
    ],
    partnersWaiting,
    funnel: {
      zipsin: [
        { label: '집신 첫 화면 방문', value: summary.landingVisitors.zipsin, unit: '명(브라우저)' },
        { label: '회원가입 화면 방문', value: summary.signupVisitors, unit: '명(브라우저)' },
        { label: '가입 완료', value: users.recent, unit: '명' },
        { label: '집 1채 이상 추가', value: distinct(homeCreators.data as Array<Record<string, string>>, 'created_by'), unit: '명' },
        { label: '기록 1개 이상 남김', value: distinct(recordCreators.data as Array<Record<string, string>>, 'created_by'), unit: '명' },
      ],
      check: [
        { label: '집신체크 방문', value: summary.landingVisitors.check, unit: '명(브라우저)' },
        { label: '후보 집을 계정에 저장', value: distinct(candidateOwners.data as Array<Record<string, string>>, 'owner_user_id'), unit: '명' },
      ],
    },
  };
}
/* v8 ignore stop */
