'use client';

import { useRef, useState, type FormEvent } from 'react';
import { unstable_rethrow } from 'next/navigation';
import { homeSchema, homeFieldErrors, type HomeFormState } from '@/features/homes/schemas/home';
import { workspaceErrorMessage } from '@/features/workspace/domain/errors';
export type { HomeFormState } from '@/features/homes/schemas/home';
export function HomeForm({ officeId, idempotencyKey, action }: {
  officeId: string;
  idempotencyKey: string;
  action: (data: FormData) => Promise<HomeFormState>;
}) {
  const [values, setValues] = useState({ addressLine1: '', addressDetail: '', homeLabel: '' });
  const [state, setState] = useState<HomeFormState>({});
  const [pending, setPending] = useState(false);
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
    const data = new FormData(event.currentTarget);
    const parsed = homeSchema.safeParse(Object.fromEntries(data));
    if (!parsed.success) { showErrors({ fieldErrors: homeFieldErrors(parsed.error) }); return; }
    saving.current = true; setPending(true); setState({});
    try { showErrors(await action(data)); }
    catch (error) { unstable_rethrow(error); showErrors({ error: workspaceErrorMessage('server_error') }); }
    finally { saving.current = false; setPending(false); }
  }
  const fields = [
    { name: 'addressLine1', label: '도로명 주소', max: 200, placeholder: '예: 서울시 예시로 10' },
    { name: 'addressDetail', label: '상세 위치 (선택)', max: 120, placeholder: '예: 101동 101호' },
    { name: 'homeLabel', label: '내부 구분명 (선택)', max: 80, placeholder: '예: 첫 관리 집' },
  ] as const;
  return (
    <form className="app-panel grid gap-6 rounded-[28px] p-6 sm:p-8" noValidate onSubmit={submit} ref={formRef} aria-busy={pending}>
      <input type="hidden" name="officeId" value={officeId} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="rounded-2xl border border-[#d4e9e3] bg-[#eff9f6] px-4 py-3">
        <p className="text-sm font-semibold leading-6 text-[#164b50]">이 사무소의 비공개 기록 공간을 만듭니다.</p>
        <p className="mt-1 text-xs leading-5 text-[#58717b]">같은 주소여도 자동으로 합치지 않습니다. 권한이 있는 사람만 확인할 수 있습니다.</p>
      </div>
      {fields.map(({ name, label, max, placeholder }) => (
        <div key={name}>
          <label className="mb-2 block font-semibold text-slate-900" htmlFor={name}>{label}</label>
          <input aria-invalid={!!state.fieldErrors?.[name]} aria-describedby={state.fieldErrors?.[name] ? `${name}-error` : undefined} className="min-h-14 w-full rounded-2xl border border-[#cbd9dc] bg-white px-4 text-base text-[#102a43] outline-none transition placeholder:text-[#8395a3] focus:border-[#087566] focus:ring-4 focus:ring-[#0a7766]/10" id={name} name={name} maxLength={max} placeholder={placeholder} readOnly={pending} value={values[name]} onChange={(event) => setValues({ ...values, [name]: event.target.value })} />
          {state.fieldErrors?.[name] && <p id={`${name}-error`} className="mt-2 text-sm text-red-700">{state.fieldErrors[name]}</p>}
        </div>
      ))}
      {state.error && <p role="alert" className="text-sm text-red-700">{state.error}</p>}
      <button className="app-primary min-h-14 rounded-2xl px-5 font-bold text-white transition focus:outline-none focus:ring-4 focus:ring-[#087566]/20 disabled:opacity-60" disabled={pending} type="submit">{pending ? '저장 중…' : '집 등록하기'}</button>
    </form>
  );
}
