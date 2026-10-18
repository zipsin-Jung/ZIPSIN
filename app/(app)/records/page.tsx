import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { RecordsFeed, type FeedRecord } from '@/features/records/components/RecordsFeed';

/** 기록 탭: 내가 볼 수 있는 모든 집의 최근 기록 (승인 시안 ⑬). 무엇이 보이는지는 RLS가 정한다. */
export default async function RecordsPage() {
  const { supabase } = await requireOnboardingComplete();
  const { data: records, error } = await supabase
    .from('records')
    .select('id, home_id, record_space, record_kind, title, occurred_at')
    .neq('record_kind', 'task')
    .order('occurred_at', { ascending: false })
    .limit(60);
  if (error) return <main className="mx-auto max-w-xl px-5 py-16"><p role="alert">기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p></main>;
  const homeIds = [...new Set((records ?? []).map((record) => record.home_id))];
  const recordIds = (records ?? []).map((record) => record.id);
  const [{ data: homes }, { data: attachments }] = await Promise.all([
    homeIds.length ? supabase.from('homes').select('id, home_label, address_line1, address_detail').in('id', homeIds) : Promise.resolve({ data: [] as Array<{ id: string; home_label: string | null; address_line1: string; address_detail: string | null }> }),
    recordIds.length ? supabase.from('attachments').select('record_id').in('record_id', recordIds).eq('status', 'ready') : Promise.resolve({ data: [] as Array<{ record_id: string }> }),
  ]);
  const homeName = new Map((homes ?? []).map((home) => [home.id, home.home_label ?? [home.address_line1, home.address_detail].filter(Boolean).join(' ')]));
  const fileCount = new Map<string, number>();
  for (const attachment of attachments ?? []) fileCount.set(attachment.record_id, (fileCount.get(attachment.record_id) ?? 0) + 1);
  const feed: FeedRecord[] = (records ?? []).map((record) => ({
    id: record.id,
    homeId: record.home_id,
    homeName: homeName.get(record.home_id) ?? '집',
    space: record.record_space as FeedRecord['space'],
    kind: record.record_kind,
    title: record.title,
    occurredAt: record.occurred_at,
    files: fileCount.get(record.id) ?? 0,
  }));
  return <RecordsFeed records={feed} />;
}
