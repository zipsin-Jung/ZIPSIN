'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { createRecordAction, type RecordFormState } from '@/features/records/actions/create-record';

export function RecordForm({ homeId, officeId, idempotencyKey }: { homeId: string; officeId: string; idempotencyKey: string }) {
  const [state, setState] = useState<RecordFormState>({}); const [pending, setPending] = useState(false);
  const router = useRouter();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    try {
      const next = await createRecordAction(new FormData(event.currentTarget));
      if (next.redirectTo) { router.push(next.redirectTo); return; }
      setState(next);
    } catch {
      setState({ error: '작성한 내용은 그대로 있어요. 잠시 후 다시 저장해 주세요.' });
    } finally {
      setPending(false);
    }
  }
  return <form onSubmit={submit} className="app-panel grid gap-5 rounded-[28px] p-6 sm:p-8"><input type="hidden" name="homeId" value={homeId} /><input type="hidden" name="officeId" value={officeId} /><input type="hidden" name="contractId" value="" /><input type="hidden" name="space" value="office_internal" /><input type="hidden" name="idempotencyKey" value={idempotencyKey} /><input type="hidden" name="taskDueAt" value="" /><input type="hidden" name="taskAssignedTo" value="" />
    <div><label htmlFor="kind" className="font-bold text-[#102a43]">기록 종류</label><select id="kind" name="kind" className="mt-2 min-h-14 w-full rounded-2xl border border-[#cbd9dc] bg-white px-4"><option value="note">메모</option><option value="photo">사진 기록</option><option value="document">문서 기록</option><option value="repair">수리 기록</option><option value="task">할 일</option></select></div>
    <div><label htmlFor="title" className="font-bold text-[#102a43]">제목</label><input id="title" name="title" maxLength={120} className="mt-2 min-h-14 w-full rounded-2xl border border-[#cbd9dc] px-4" required />{state.fieldErrors?.title && <p className="mt-2 text-sm text-red-700">{state.fieldErrors.title}</p>}</div>
    <div><label htmlFor="body" className="font-bold text-[#102a43]">내용</label><textarea id="body" name="body" maxLength={10000} rows={6} className="mt-2 w-full rounded-2xl border border-[#cbd9dc] p-4" /></div>{state.error && <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p>}<button disabled={pending} className="app-primary min-h-14 rounded-2xl font-bold text-white">{pending ? '저장 중…' : '집 기록에 남기기'}</button></form>;
}
