'use client';

import { useState, type FormEvent } from 'react';
import { createRelationshipInvitationAction, type RelationshipInvitationState } from '@/features/relationships/actions/create-invitation';
import { endRelationshipAction } from '@/features/relationships/actions/end-relationship';

type Contract = { id: string; contract_kind: string };
type Person = { id: string; relationship_role: string; access_scope: string; expires_at: string | null };

export function PeoplePanel({ homeId, contracts, people }: { homeId: string; contracts: Contract[]; people: Person[] }) {
  const [state, setState] = useState<RelationshipInvitationState>({});
  const [pending, setPending] = useState(false);
  const [role, setRole] = useState('landlord');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setState({});
    try { setState(await createRelationshipInvitationAction(new FormData(event.currentTarget))); }
    finally { setPending(false); }
  }

  const repairer = role === 'repairer';
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_420px]">
      <section>
        <h2 className="text-2xl font-extrabold text-[#102a43]">함께하는 사람</h2>
        {people.length ? <ul className="mt-5 grid gap-3">{people.map((person) => (
          <li key={person.id} className="app-panel flex items-center justify-between gap-4 rounded-2xl p-5">
            <div><strong>{roleLabel(person.relationship_role)}</strong><p className="mt-1 text-sm text-[#607785]">{person.access_scope === 'repair_event' ? '수리 참여' : '현재 계약'}</p></div>
            <form action={endRelationshipAction}><input type="hidden" name="membershipId" value={person.id} /><input type="hidden" name="homeId" value={homeId} /><button className="rounded-xl border border-[#cbd9dc] px-4 py-2 text-sm font-bold text-red-700">권한 종료</button></form>
          </li>
        ))}</ul> : <p className="app-panel mt-5 rounded-2xl p-6 text-[#607785]">아직 연결된 관계자가 없습니다.</p>}
      </section>
      <form onSubmit={submit} className="app-panel h-fit rounded-[28px] p-6">
        <h2 className="text-xl font-extrabold text-[#102a43]">관계자 초대</h2>
        <input type="hidden" name="homeId" value={homeId} />
        <label className="mt-5 block font-bold" htmlFor="relationship-role">역할</label>
        <select id="relationship-role" name="role" value={role} onChange={(event) => setRole(event.target.value)} className="mt-2 min-h-12 w-full rounded-xl border border-[#cbd9dc] px-3">
          <option value="landlord">임대인</option><option value="tenant">임차인</option><option value="repairer">수리기사</option>
        </select>
        <input type="hidden" name="scope" value={repairer ? 'repair_event' : 'current_contract'} />
        {!repairer && <><label className="mt-4 block font-bold" htmlFor="contractId">현재 계약</label><select id="contractId" name="contractId" required className="mt-2 min-h-12 w-full rounded-xl border border-[#cbd9dc] px-3"><option value="">계약 선택</option>{contracts.map((contract) => <option key={contract.id} value={contract.id}>{contract.contract_kind}</option>)}</select></>}
        {repairer && <><label className="mt-4 block font-bold" htmlFor="relationshipExpiresAt">수리 접근 종료 시간</label><input id="relationshipExpiresAt" name="relationshipExpiresAt" type="datetime-local" required className="mt-2 min-h-12 w-full rounded-xl border border-[#cbd9dc] px-3" /></>}
        <p className="mt-4 text-sm leading-6 text-[#607785]">초대는 48시간 동안 한 번만 사용합니다. 주소만으로는 기록을 볼 수 없습니다.</p>
        <button disabled={pending} className="app-primary mt-5 min-h-12 w-full rounded-xl font-bold text-white disabled:opacity-60">{pending ? '만드는 중…' : '보안 초대 링크 만들기'}</button>
        {state.error && <p role="alert" className="mt-4 text-sm font-bold text-red-700">{state.error}</p>}
        {state.invitePath && <code className="mt-4 block break-all rounded-xl bg-[#eff9f6] p-3 text-xs">{state.invitePath}</code>}
      </form>
    </div>
  );
}

function roleLabel(role: string) { return role === 'landlord' ? '임대인' : role === 'tenant' ? '임차인' : '수리기사'; }
