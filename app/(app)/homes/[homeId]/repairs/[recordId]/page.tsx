import Link from 'next/link';
import { Check, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { AttachmentLink } from '@/features/attachments/components/AttachmentLink';
import { AttachmentUploader } from '@/features/attachments/components/AttachmentUploader';
import { advanceRepairAction } from '@/features/repairs/actions';
import { METHOD_LABEL, REPAIR_STAGES, ROLE_LABEL, nextRepairActions, repairErrorMessage, type RepairRole, type RepairStage } from '@/features/repairs/domain';

type Props = { params: Promise<{ homeId: string; recordId: string }>; searchParams?: Promise<{ error?: string }> };

const when = (iso: string) => new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });

/** 수리 5단계 (v2 시안 V2Repair). 단계마다 날짜와 누른 역할이 자동으로 남는다. */
export default async function RepairPage({ params, searchParams }: Props) {
  const { homeId, recordId } = await params;
  const query = (await searchParams) ?? {};
  if (!z.uuid().safeParse(homeId).success || !z.uuid().safeParse(recordId).success) return <Missing />;
  const { supabase } = await requireOnboardingComplete();
  const { data: record } = await supabase.from('records').select('id, home_id, title, body, repair_stage, repair_stage_changed_at, occurred_at').eq('id', recordId).eq('home_id', homeId).maybeSingle();
  if (!record?.repair_stage) return <Missing />;
  const [{ data: role }, { data: events }, { data: attachments }] = await Promise.all([
    supabase.rpc('repair_actor_role', { p_record_id: recordId }),
    supabase.rpc('get_repair_stage_events', { p_record_id: recordId }),
    supabase.from('attachments').select('id, original_name, created_at').eq('record_id', recordId).eq('status', 'ready').order('created_at'),
  ]);
  const stage = record.repair_stage as RepairStage;
  const currentIndex = REPAIR_STAGES.findIndex((item) => item.id === stage);
  const actions = nextRepairActions(stage, (role as RepairRole | null) ?? null);
  const reachedAt = new Map<string, { at: string; role: string; method: string; me: boolean }>(
    (events ?? []).map((event: { to_stage: string; created_at: string; actor_role: string; method: string; is_me: boolean }) => [event.to_stage, { at: event.created_at, role: event.actor_role, method: event.method, me: event.is_me }]),
  );
  const error = repairErrorMessage(query.error);
  const uploadsAfterStage = (attachments ?? []).filter((attachment) => record.repair_stage_changed_at && attachment.created_at >= record.repair_stage_changed_at).length;
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <div className="flex items-center gap-1">
        <Link aria-label="집 화면으로" className="-ml-2 grid size-11 place-items-center rounded-lg text-[#212124]" href={`/homes/${homeId}`}><ChevronLeft aria-hidden="true" className="size-6" /></Link>
        <h1 className="min-w-0 flex-1 truncate text-[20px] font-bold tracking-[-0.02em] text-[#212124]">수리 · {record.title}</h1>
      </div>
      {record.body && <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">{record.body}</p>}
      {error && <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{error}</p>}

      <ol aria-label="수리 단계" className="mt-5">
        {REPAIR_STAGES.map((item, index) => {
          const done = index < currentIndex || (index === currentIndex && stage === 'receipt_attached');
          const current = index === currentIndex && stage !== 'receipt_attached';
          const reached = index === 0 ? { at: record.occurred_at, role: '', method: '', me: false } : reachedAt.get(item.id);
          return (
            <li aria-current={current ? 'step' : undefined} className="relative flex gap-3 pb-5 last:pb-0" key={item.id}>
              {index < REPAIR_STAGES.length - 1 && <span aria-hidden="true" className={`absolute left-[13px] top-7 h-[calc(100%-20px)] w-0.5 ${index < currentIndex ? 'bg-[#0B6655]' : 'bg-[#EAEBEE]'}`} />}
              <span aria-hidden="true" className={`relative grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold ${done ? 'bg-[#0B6655] text-white' : current ? 'border-2 border-[#0B6655] bg-white text-[#0B6655]' : 'border-2 border-[#DCDEE3] bg-white text-[#6B7079]'}`}>{done ? <Check className="size-4" /> : index + 1}</span>
              <span className="min-w-0">
                <strong className={`block text-[17px] ${current ? 'text-[#0B6655]' : 'text-[#212124]'}`}>{item.label}{current && <span className="sr-only"> (지금 단계)</span>}</strong>
                <span className="block text-[15px] text-[#6B7079]">
                  {reached && index <= currentIndex ? `${when(reached.at)}${reached.role ? ` · ${ROLE_LABEL[reached.role as RepairRole] ?? ''}${reached.method && reached.method !== 'app' ? ` (${METHOD_LABEL[reached.method]})` : ''}${reached.me ? ' · 나' : ''}` : ''}` : item.desc}
                </span>
              </span>
            </li>
          );
        })}
      </ol>

      {actions.map((action) => (
        <form action={advanceRepairAction} className="mt-6 grid gap-2 rounded-2xl bg-[#FBF3E6] p-4" key={`${action.to}-${action.method}`}>
          <strong className="text-[15px] text-[#8A5A10]">지금 할 일</strong>
          {action.hint && <p className="text-[15px] text-[#4D5159]">{action.hint}{action.needsUpload ? ` (이 단계에 올린 파일 ${uploadsAfterStage}개)` : ''}</p>}
          <input name="homeId" type="hidden" value={homeId} /><input name="recordId" type="hidden" value={recordId} />
          <input name="to" type="hidden" value={action.to} /><input name="method" type="hidden" value={action.method} />
          {action.method === 'phone_confirmed' && (
            <>
              <label className="text-[15px] font-semibold text-[#212124]" htmlFor="repair-note">통화 메모</label>
              <input className="min-h-12 rounded-xl border border-[#DCDEE3] bg-white px-3 text-base" id="repair-note" maxLength={200} name="note" placeholder="예: 임대인 통화 10:20, 수리 동의" required />
            </>
          )}
          <button className="app-primary min-h-14 rounded-xl text-[17px] font-bold text-white" type="submit">{action.label}</button>
        </form>
      ))}

      <section aria-labelledby="repair-files" className="mt-6">
        <h2 className="text-[17px] font-bold text-[#212124]" id="repair-files">사진 · 영수증 {attachments?.length ?? 0}개</h2>
        {attachments && attachments.length > 0 && <div className="mt-2 flex flex-col gap-1">{attachments.map((attachment) => <AttachmentLink attachmentId={attachment.id} key={attachment.id} name={attachment.original_name} />)}</div>}
        {stage !== 'receipt_attached' && <div className="mt-3"><AttachmentUploader recordId={recordId} /></div>}
      </section>
      <p className="mt-6 text-sm text-[#6B7079]">단계마다 날짜와 누른 사람의 역할이 자동으로 남아요.</p>
    </main>
  );
}

function Missing() {
  return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-xl font-bold">볼 수 없는 수리 기록이에요</h1></main>;
}
