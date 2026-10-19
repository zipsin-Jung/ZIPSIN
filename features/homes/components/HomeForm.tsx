'use client';

import Link from 'next/link';
import { useRef, useState, type FormEvent } from 'react';
import { Mascot } from '@/components/Brand';
import { homeSchema, homeFieldErrors, type HomeFormState } from '@/features/homes/schemas/home';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';
export type { HomeFormState } from '@/features/homes/schemas/home';

type Saved = { homeId: string; name: string };
const newKey = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : undefined);
const homeIdFrom = (state: HomeFormState) => state.homeId ?? state.redirectTo?.match(/^\/homes\/([^/?#]+)/)?.[1];

/**
 * 10초 집 등록 (2026-10-18 승인 제안 ⑤-가).
 * 주소와 호수만 적으면 끝. '같은 건물 다른 호수'는 주소를 남겨 두고 호수만 비운다.
 * 같은 요청이 두 번 저장되지 않도록 요청 키는 실패·재시도 동안 유지하고, 성공한 뒤에만 새로 만든다.
 */
export function HomeForm({ officeId, idempotencyKey, action }: {
  officeId: string;
  idempotencyKey: string;
  action: (data: FormData) => Promise<HomeFormState>;
}) {
  const [values, setValues] = useState({ addressLine1: '', addressDetail: '', homeLabel: '' });
  const [requestKey, setRequestKey] = useState(idempotencyKey);
  const [state, setState] = useState<HomeFormState>({});
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState<Saved | null>(null);
  const [sameBuildingNote, setSameBuildingNote] = useState('');
  const saving = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  function showErrors(next: HomeFormState) {
    setState(next);
    const firstField = Object.keys(next.fieldErrors ?? {})[0];
    if (firstField) (formRef.current?.elements.namedItem(firstField) as HTMLInputElement | null)?.focus();
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const sameBuilding = submitter?.value === 'same-building';
    const data = new FormData(event.currentTarget);
    const parsed = homeSchema.safeParse(Object.fromEntries(data));
    if (!parsed.success) { showErrors({ fieldErrors: homeFieldErrors(parsed.error) }); return; }
    saving.current = true; setPending(true); setState({}); setSameBuildingNote('');
    try {
      const next = await action(data);
      const homeId = homeIdFrom(next);
      if (homeId) {
        const name = values.homeLabel.trim() || [values.addressLine1.trim(), values.addressDetail.trim()].filter(Boolean).join(' ');
        const fresh = newKey();
        if (fresh) setRequestKey(fresh);
        if (sameBuilding && fresh) {
          setValues({ ...values, addressDetail: '', homeLabel: '' });
          setSameBuildingNote(`${name} 등록 끝. 같은 건물의 다른 호수를 적어 주세요.`);
          (formRef.current?.elements.namedItem('addressDetail') as HTMLInputElement | null)?.focus();
        } else {
          setSaved({ homeId, name });
        }
        return;
      }
      showErrors(next);
    }
    catch { showErrors({ error: workspaceErrorMessage('server_error') }); }
    finally { saving.current = false; setPending(false); }
  }

  if (saved) {
    return (
      <section aria-live="polite" className="rounded-[20px] border border-[#EAEBEE] bg-white p-6 text-center sm:p-10">
        <Mascot className="mx-auto !mb-3 !w-[110px]" pose="happy" />
        <h2 className="text-[22px] font-bold tracking-[-0.02em] text-[#212124]">{saved.name} 등록 끝</h2>
        <p className="mt-2 text-base text-[#4D5159]">사진은 휴대폰 앨범에서 한꺼번에 골라 올리면 돼요.</p>
        <div className="mt-6 grid gap-2">
          <Link className="app-primary flex min-h-14 items-center justify-center rounded-xl text-[17px] font-bold text-white" href={`/records/bulk?homeId=${encodeURIComponent(saved.homeId)}`}>앨범에서 사진 한꺼번에 올리기</Link>
          <Link className="flex min-h-12 items-center justify-center rounded-xl border border-[#DCDEE3] bg-white text-base font-semibold text-[#212124]" href={`/homes/${saved.homeId}`}>집 화면 보기</Link>
          <button className="min-h-12 text-base font-semibold text-[#0B6655]" onClick={() => { setSaved(null); setValues({ addressLine1: '', addressDetail: '', homeLabel: '' }); }} type="button">다른 집 등록하기</button>
        </div>
      </section>
    );
  }

  const fieldClass = 'min-h-14 w-full rounded-xl border border-[#DCDEE3] bg-white px-4 text-base text-[#212124] outline-none placeholder:text-[#6B7079] focus:border-[#0B6655] focus:ring-4 focus:ring-[#0B6655]/10';
  const field = (name: 'addressLine1' | 'addressDetail' | 'homeLabel', label: string, max: number, placeholder: string, hint?: string) => (
    <div>
      <label className="mb-2 block text-[15px] font-semibold text-[#212124]" htmlFor={name}>{label}</label>
      <input aria-invalid={!!state.fieldErrors?.[name]} aria-describedby={state.fieldErrors?.[name] ? `${name}-error` : hint ? `${name}-hint` : undefined} className={fieldClass} id={name} name={name} maxLength={max} placeholder={placeholder} readOnly={pending} value={values[name]} onChange={(event) => setValues({ ...values, [name]: event.target.value })} />
      {hint && !state.fieldErrors?.[name] && <p className="mt-1.5 text-sm text-[#6B7079]" id={`${name}-hint`}>{hint}</p>}
      {state.fieldErrors?.[name] && <p id={`${name}-error`} className="mt-2 text-[15px] text-red-700">{state.fieldErrors[name]}</p>}
    </div>
  );
  return (
    <form className="grid gap-5 rounded-[20px] border border-[#EAEBEE] bg-white p-5 sm:p-8" noValidate onSubmit={submit} ref={formRef} aria-busy={pending}>
      <input type="hidden" name="officeId" value={officeId} />
      <input type="hidden" name="idempotencyKey" value={requestKey} />
      <p className="text-base leading-7 text-[#4D5159]">주소와 호수만 적으면 끝나요. 계약 기간은 나중에 채워도 돼요.</p>
      {sameBuildingNote && <p className="rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">{sameBuildingNote}</p>}
      {field('addressLine1', '주소', 200, '예: 서울 노원구 공릉로 10')}
      {field('addressDetail', '동·호수 (선택)', 120, '예: 201호')}
      <details className="rounded-xl border border-[#EAEBEE] px-4 py-3">
        <summary className="cursor-pointer text-[15px] font-semibold text-[#4D5159]">사무소에서 부르는 이름 적기 (선택)</summary>
        <div className="mt-3">{field('homeLabel', '내부 구분명 (선택)', 80, '예: 공릉 첫 집')}</div>
      </details>
      <p className="text-sm leading-6 text-[#6B7079]">이 사무소의 비공개 기록 공간을 만들어요. 같은 주소여도 자동으로 합치지 않습니다. 권한이 있는 사람만 볼 수 있어요.</p>
      {state.error && <p role="alert" className="text-[15px] text-red-700">{state.error}</p>}
      <div className="grid gap-2">
        <button className="app-primary min-h-14 rounded-xl px-5 text-[17px] font-bold text-white disabled:opacity-60" disabled={pending} name="intent" type="submit" value="done">{pending ? '저장 중…' : '집 등록하기'}</button>
        <button className="min-h-12 rounded-xl border border-[#DCDEE3] bg-white px-4 text-base font-semibold text-[#212124] disabled:opacity-60" disabled={pending} name="intent" type="submit" value="same-building">등록하고 같은 건물 다른 호수 바로 추가</button>
      </div>
    </form>
  );
}
