'use client';

import { useState } from 'react';
import { requestAccountRecoveryAction } from '@/features/auth/actions/request-account-recovery';

export function AccountRecoveryForm() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  async function sendPhoneCode() {
    const response = await fetch('/api/auth/recovery/phone/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
    const body = await response.json();
    if (response.ok) { setChallengeId(body.challengeId); setMessage(`${body.maskedPhone}로 인증번호를 보냈습니다.`); }
    else setMessage('잠시 후 다시 시도해 주세요.');
  }

  async function verifyPhoneCode() {
    const response = await fetch('/api/auth/recovery/phone/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code }) });
    const body = await response.json();
    setMessage(response.ok ? (body.username ? `확인된 아이디: ${body.username}` : '이 번호로 확인되는 집신 아이디가 없습니다.') : '인증번호를 확인해 주세요.');
  }

  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="계정 확인 방법">
        <button aria-selected={method === 'email'} className="min-h-11 rounded-xl border font-bold" onClick={() => setMethod('email')} role="tab" type="button">이메일</button>
        <button aria-selected={method === 'phone'} className="min-h-11 rounded-xl border font-bold" onClick={() => setMethod('phone')} role="tab" type="button">휴대폰</button>
      </div>
      {method === 'email' ? <form action={requestAccountRecoveryAction} className="grid gap-5">
      <label className="font-bold text-slate-800">
        가입 이메일
        <input className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-emerald-700" name="email" type="email" autoComplete="email" required />
      </label>
      <button className="min-h-13 rounded-xl bg-[#0b543f] px-5 font-extrabold text-white" type="submit">확인 메일 받기</button>
      </form> : <div className="grid gap-4">
        <label className="font-bold text-slate-800">가입 휴대폰<input autoComplete="tel" className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4" onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" type="tel" value={phone} /></label>
        <button className="min-h-13 rounded-xl bg-[#0b543f] px-5 font-extrabold text-white" onClick={sendPhoneCode} type="button">인증번호 받기</button>
        {challengeId && <><label className="font-bold text-slate-800">인증번호<input autoComplete="one-time-code" className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} value={code} /></label><button className="min-h-13 rounded-xl border border-emerald-800 px-5 font-extrabold text-emerald-900" onClick={verifyPhoneCode} type="button">아이디 확인</button></>}
        {message && <p aria-live="polite" className="rounded-xl bg-slate-100 p-4">{message}</p>}
      </div>}
    </div>
  );
}
