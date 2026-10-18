'use client';

import { useRef, useState, type FormEvent } from 'react';
import { saveContractAction, type ContractFormState } from '@/features/contracts/actions/save-contract';
import { contractSchema } from '@/features/contracts/schemas/contract';

type Initial = { contractKind: 'owner_occupied' | 'jeonse' | 'monthly_rent' | 'other'; startsOn: string; endsOn: string };

export function ContractForm({
  homeId,
  idempotencyKey,
  action = saveContractAction,
  initial = { contractKind: 'jeonse', startsOn: '', endsOn: '' },
  contractExists = false,
}: {
  homeId: string;
  idempotencyKey: string;
  action?: (formData: FormData) => Promise<ContractFormState>;
  initial?: Initial;
  contractExists?: boolean;
}) {
  const [state, setState] = useState<ContractFormState>({});
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const formData = new FormData(event.currentTarget);
    const parsed = contractSchema.safeParse(Object.fromEntries(formData));
    if (!parsed.success) {
      const fieldErrors = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0]), issue.message]));
      setState({ fieldErrors });
      const first = Object.keys(fieldErrors)[0];
      if (first) (formRef.current?.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    saving.current = true;
    setPending(true);
    setState({});
    try {
      const result = await action(formData);
      setState(result);
    } catch {
      setState({ error: '저장하지 못했습니다. 잠시 후 다시 시도해 주세요.' });
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <form aria-busy={pending} className="rounded-2xl border border-[#E1E6E3] bg-[#f7faf9] p-5" id="contract-form" noValidate onSubmit={submit} ref={formRef}>
      <input name="homeId" type="hidden" value={homeId} />
      <input name="idempotencyKey" type="hidden" value={idempotencyKey} />
      <h2 className="text-lg font-black text-[#16211E]">계약 기간 확인</h2>
      <p className="mt-1 text-sm leading-6 text-[#5D6A65]">계약서와 비교해 직접 확인한 날짜를 입력해 주세요.</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="text-sm font-bold text-[#3E4B47]" htmlFor="contract-kind">계약 종류{contractExists && <input name="contractKind" type="hidden" value={initial.contractKind} />}<select aria-label="계약 종류" className="mt-2 min-h-12 w-full rounded-xl border border-[#E1E6E3] bg-white px-3 font-normal disabled:cursor-not-allowed disabled:bg-[#eef3f2] disabled:text-[#5D6A65]" defaultValue={initial.contractKind} disabled={contractExists} id="contract-kind" name={contractExists ? undefined : 'contractKind'}><option value="jeonse">전세</option><option value="monthly_rent">월세</option><option value="owner_occupied">자가 거주</option><option value="other">기타</option></select>{contractExists && <span className="mt-2 block text-xs font-normal text-[#5D6A65]">기존 계약에서는 날짜만 수정할 수 있습니다.</span>}</label>
        <label className="text-sm font-bold text-[#3E4B47]">계약 시작일<input className="mt-2 min-h-12 w-full rounded-xl border border-[#E1E6E3] bg-white px-3 font-normal" defaultValue={initial.startsOn} name="startsOn" type="date" /></label>
        <label className="text-sm font-bold text-[#3E4B47]">계약 만기일<input aria-describedby={state.fieldErrors?.endsOn ? 'endsOn-error' : undefined} aria-invalid={Boolean(state.fieldErrors?.endsOn)} className="mt-2 min-h-12 w-full rounded-xl border border-[#E1E6E3] bg-white px-3 font-normal" defaultValue={initial.endsOn} name="endsOn" type="date" />{state.fieldErrors?.endsOn && <span className="mt-2 block text-sm font-semibold text-red-700" id="endsOn-error">{state.fieldErrors.endsOn}</span>}</label>
      </div>
      {state.error && <p className="mt-4 text-sm font-semibold text-red-700" role="alert">{state.error}</p>}
      {state.saved && <p className="mt-4 text-sm font-semibold text-[#0B6655]" role="status">계약 기간을 저장했습니다.</p>}
      <button className="app-primary mt-5 min-h-12 rounded-xl px-5 text-sm font-bold text-white disabled:opacity-60" disabled={pending} type="submit">{pending ? '저장 중…' : '계약 기간 저장'}</button>
    </form>
  );
}
