'use client';

import { useState, useTransition } from 'react';
import { saveContractPlanAction, type ContractPlanState } from '@/features/contracts/actions/save-plan';
import type { PlanStatus } from '@/features/contracts/domain/lifecycle';

const statusLabels: Record<PlanStatus, string> = {
  undecided: '아직 결정 전',
  renewal_considering: '연장 생각 중',
  move_out_preparing: '퇴거 준비',
};

type ContractSummaryView = {
  homeLabel: string;
  addressLine1: string;
  addressDetail: string | null;
  contractId: string | null;
  endsOn: string | null;
  contractDay: { label: string; days: number } | null;
  ownRelationship: 'landlord' | 'tenant' | null;
  ownPlanStatus: PlanStatus;
  partyPlans: Array<{ role: 'landlord' | 'tenant'; status: PlanStatus }>;
};

function formatKoreanDate(value: string | null): string {
  if (!value) return '만기일을 확인해 주세요';
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return '만기일을 확인해 주세요';
  return `${year}년 ${month}월 ${day}일`;
}

export function ContractSummary({
  summary,
  onPlanSave = saveContractPlanAction,
}: {
  summary: ContractSummaryView;
  onPlanSave?: (formData: FormData) => Promise<ContractPlanState>;
}) {
  const [current, setCurrent] = useState(summary.ownPlanStatus);
  const [message, setMessage] = useState('');
  const [isPending, startTransition] = useTransition();
  const visiblePlans = summary.partyPlans.map((item) => ({
    ...item,
    status: item.role === summary.ownRelationship ? current : item.status,
  }));
  const landlord = visiblePlans.find((item) => item.role === 'landlord')?.status;
  const tenant = visiblePlans.find((item) => item.role === 'tenant')?.status;
  const disagrees = landlord && tenant && landlord !== 'undecided' && tenant !== 'undecided' && landlord !== tenant;

  function save(next: PlanStatus) {
    if (!summary.contractId || !summary.ownRelationship || isPending) return;
    const data = new FormData();
    data.set('contractId', summary.contractId);
    data.set('planStatus', next);
    startTransition(async () => {
      const result = await onPlanSave(data);
      if (result.error) { setMessage(result.error); return; }
      setCurrent(next);
      setMessage('내 준비 상태를 저장했습니다.');
    });
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#d8e3e0] bg-white shadow-[0_24px_70px_rgba(20,54,57,.08)]">
      <div className="grid gap-7 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-bold text-[#0B6655]">현재 집</p>
          <h1 className="mt-2 text-3xl font-black tracking-[-0.045em] text-[#16211E] sm:text-4xl">{summary.homeLabel}</h1>
          <p className="mt-3 text-sm text-[#5D6A65]">{summary.addressLine1} · 상세 주소 보호됨</p>
        </div>
        <div className="rounded-2xl bg-[#E3F0EC] px-6 py-5 lg:min-w-56">
          <p className="text-sm font-bold text-[#476772]">계약 만기</p>
          <p className="mt-1 text-4xl font-black tracking-[-0.04em] text-[#0B6655]">{summary.contractDay?.label ?? '날짜 확인'}</p>
          <p className="mt-1 text-sm font-semibold text-[#345562]">{formatKoreanDate(summary.endsOn)}</p>
        </div>
      </div>

      <div className="border-t border-[#e3ebe8] bg-[#fbfcfc] p-6 sm:p-8" id="expiry-plan">
        <h2 className="text-xl font-black text-[#16211E]">만기 뒤 계획</h2>
        <p className="mt-2 text-sm leading-6 text-[#5D6A65]">계획을 정하면 지금부터 필요한 준비 순서를 알려드려요.</p>
        {summary.contractId && summary.ownRelationship ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {(Object.keys(statusLabels) as PlanStatus[]).map((status) => (
              <button aria-pressed={current === status} className="min-h-12 rounded-xl border border-[#bfd0cc] bg-white px-3 text-sm font-bold text-[#3E4B47] transition aria-pressed:border-[#0B6655] aria-pressed:bg-[#0B6655] aria-pressed:text-white" disabled={isPending} key={status} onClick={() => save(status)} type="button">{statusLabels[status]}</button>
            ))}
          </div>
        ) : <p className="mt-4 rounded-xl bg-white p-4 text-sm text-[#5D6A65]">현재 계약의 임대인 또는 임차인만 자신의 준비 상태를 바꿀 수 있습니다.</p>}
        {visiblePlans.length > 0 && (
          <div aria-label="계약 당사자 준비 상태" className="mt-4 flex flex-wrap gap-2">
            {visiblePlans.map((item, index) => (
              <span className="rounded-full border border-[#d8e3e0] bg-white px-3 py-2 text-xs font-bold text-[#476772]" key={`${item.role}-${index}`}>
                {item.role === 'landlord' ? '임대인' : '임차인'} · {statusLabels[item.status]}
              </span>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs leading-5 text-[#687b84]">이 선택은 집신 안에서 준비 순서를 정하기 위한 것입니다. 계약 연장이나 퇴거 통지가 자동으로 전달되지는 않습니다.</p>
        {disagrees && <p className="mt-3 font-bold text-[#a75b16]">서로 확인이 필요해요</p>}
        {message && <p className={message.includes('저장했습니다') ? 'mt-3 text-sm font-semibold text-[#0B6655]' : 'mt-3 text-sm font-semibold text-red-700'} role="status">{message}</p>}
      </div>
    </section>
  );
}
