'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeSignup } from '@/features/auth/actions/complete-signup';

export function VerificationForm({ email = '', displayName = '' }) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);

  async function sendCode() {
    setMessage('인증번호를 요청하고 있습니다.');
    const response = await fetch('/api/phone/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    const body = await response.json();
    if (!response.ok) {
      setMessage('인증번호를 보내지 못했습니다. 잠시 후 다시 시도해 주세요.');
      return;
    }
    setChallengeId(body.challengeId);
    setMessage(`${body.maskedPhone}로 인증번호를 보냈습니다.${body.developmentCode ? ` 개발용 번호: ${body.developmentCode}` : ''}`);
  }

  async function verifyCode() {
    const response = await fetch('/api/phone/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ challengeId, code }),
    });
    setVerified(response.ok);
    setMessage(response.ok ? '휴대전화 인증이 완료됐습니다.' : '인증번호를 확인해 주세요.');
  }

  async function submit(formData: FormData) {
    if (!verified) {
      setMessage('휴대전화 인증을 먼저 완료해 주세요.');
      return;
    }
    const result = await completeSignup({
      displayName: formData.get('displayName'),
      email: formData.get('email'),
      challengeId,
      termsAccepted: formData.get('termsAccepted') === 'on',
      privacyAccepted: formData.get('privacyAccepted') === 'on',
      ageOver14: formData.get('ageOver14') === 'on',
      marketingSmsAccepted: formData.get('marketingSmsAccepted') === 'on',
      marketingEmailAccepted: formData.get('marketingEmailAccepted') === 'on',
    });
    if (result.ok) {
      router.replace('/onboarding/role');
      router.refresh();
      return;
    }
    setMessage('입력 내용을 확인해 주세요.');
  }

  return (
    <form action={submit} className="grid gap-5">
      <label className="grid gap-2">이름<input className="rounded-xl border p-3" defaultValue={displayName} name="displayName" required /></label>
      <label className="grid gap-2">이메일<input className="rounded-xl border p-3" defaultValue={email} name="email" required type="email" /></label>
      <fieldset className="grid gap-3 rounded-2xl border p-4">
        <legend className="px-2 font-semibold">휴대전화 인증</legend>
        <label className="grid gap-2">전화번호<input className="rounded-xl border p-3" onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" type="tel" value={phone} /></label>
        <button className="rounded-xl bg-emerald-900 p-3 font-semibold text-white" onClick={sendCode} type="button">인증번호 받기</button>
        {challengeId && <><label className="grid gap-2">인증번호<input className="rounded-xl border p-3" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} value={code} /></label><button className="rounded-xl border border-emerald-900 p-3 font-semibold" onClick={verifyCode} type="button">인증하기</button></>}
      </fieldset>
      <label><input name="termsAccepted" required type="checkbox" /> 서비스 이용약관 동의 (필수)</label>
      <label><input name="privacyAccepted" required type="checkbox" /> 개인정보 수집·이용 동의 (필수)</label>
      <label><input name="ageOver14" required type="checkbox" /> 만 14세 이상입니다 (필수)</label>
      <label><input name="marketingSmsAccepted" type="checkbox" /> 문자 마케팅 수신 (선택)</label>
      <label><input name="marketingEmailAccepted" type="checkbox" /> 이메일 마케팅 수신 (선택)</label>
      <button className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white" type="submit">가입 완료</button>
      {message && <p aria-live="polite" className="rounded-xl bg-slate-100 p-4">{message}</p>}
    </form>
  );
}
