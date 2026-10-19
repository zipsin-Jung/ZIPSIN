'use client';

import { useActionState, useState } from 'react';
import type { EndActionState } from '@/features/contracts/actions/end-contract';

type Props = {
  action: (previous: EndActionState, formData: FormData) => Promise<EndActionState>;
  fields: Record<string, string>;
  label: string;
  confirmText: string;
  confirmLabel: string;
};

/** 되돌리기 어려운 종료 작업은 한 번 더 확인한 뒤에만 보냅니다. */
export function ConfirmEndForm({ action, fields, label, confirmText, confirmLabel }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const [asking, setAsking] = useState(false);
  const buttonClass = 'rounded-xl border border-[#EAEBEE] px-4 py-2 text-sm font-bold text-red-700 disabled:opacity-60';

  return (
    <div className="grid justify-items-end gap-2">
      {!asking ? (
        <button type="button" className={buttonClass} onClick={() => setAsking(true)}>{label}</button>
      ) : (
        <form action={formAction} className="grid justify-items-end gap-2" role="group" aria-label={label}>
          {Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}
          <p className="max-w-xs text-right text-sm text-[#212124]">{confirmText}</p>
          <div className="flex gap-2">
            <button type="button" className="rounded-xl border border-[#EAEBEE] px-4 py-2 text-sm font-bold text-[#212124]" onClick={() => setAsking(false)}>취소</button>
            <button type="submit" disabled={pending} className="rounded-xl bg-red-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-60">{pending ? '처리 중…' : confirmLabel}</button>
          </div>
        </form>
      )}
      {state.error ? <p role="alert" className="text-sm font-bold text-red-700">{state.error}</p> : null}
    </div>
  );
}
