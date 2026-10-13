'use client';

import { useState, useTransition } from 'react';
import { saveUsagePurpose } from '@/features/auth/actions/save-purpose';
import {
  BROKER_ROLE_OPTIONS,
  PURPOSE_OPTIONS,
  type BrokerRole,
  type UsagePurpose,
} from '@/features/auth/domain/purpose';

type Selection = { purpose: UsagePurpose; brokerRole: BrokerRole | null };
type Props = { onSave?: (selection: Selection) => Promise<unknown> };

export function PurposePicker({ onSave = saveUsagePurpose }: Props) {
  const [purpose, setPurpose] = useState<UsagePurpose | null>(null);
  const [brokerRole, setBrokerRole] = useState<BrokerRole | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const ready = Boolean(purpose && (purpose !== 'broker' || brokerRole));

  function choosePurpose(next: UsagePurpose) {
    setPurpose(next);
    setBrokerRole(null);
    setError(null);
  }

  return (
    <div>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="sr-only">집신 사용 목적</legend>
        {PURPOSE_OPTIONS.map((option) => (
          <label className="flex min-h-28 cursor-pointer gap-4 rounded-2xl border border-slate-300 bg-white p-4 transition has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50" key={option.id}>
            <input aria-label={option.label} checked={purpose === option.id} name="purpose" onChange={() => choosePurpose(option.id)} type="radio" value={option.id} />
            <span><strong className="block text-lg text-slate-950">{option.label}</strong><span className="mt-1 block text-sm leading-6 text-slate-600">{option.description}</span></span>
          </label>
        ))}
      </fieldset>

      {purpose === 'broker' && (
        <fieldset className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <legend className="px-1 font-bold text-slate-950">공인중개사 세부 역할</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {BROKER_ROLE_OPTIONS.map((option) => (
              <label className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 has-[:checked]:border-emerald-800 has-[:checked]:bg-emerald-50" key={option.id}>
                <input aria-label={option.label} checked={brokerRole === option.id} name="brokerRole" onChange={() => setBrokerRole(option.id)} type="radio" value={option.id} />
                <span className="text-sm font-semibold">{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {purpose === 'management_other' && <p className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">관리·기타 사용자는 유효기간이 있는 초대를 받은 뒤 허용된 집과 기록만 볼 수 있습니다.</p>}
      <p className="mt-5 text-sm leading-6 text-slate-600">이 선택은 화면 안내를 맞추기 위한 것입니다. 집 기록은 집을 만들거나 보안 초대를 수락한 뒤에만 볼 수 있습니다.</p>
      {error && <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p>}
      <button
        className="mt-6 min-h-12 w-full rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white disabled:bg-slate-300"
        disabled={!ready || isPending}
        onClick={() => purpose && startTransition(async () => {
          setError(null);
          const result = await onSave({ purpose, brokerRole });
          if (result && typeof result === 'object' && 'ok' in result && !result.ok) setError('저장하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        })}
        type="button"
      >
        {isPending ? '저장 중…' : '집신 시작하기'}
      </button>
    </div>
  );
}
