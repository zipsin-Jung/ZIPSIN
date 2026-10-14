'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeSignup } from '@/features/auth/actions/complete-signup';

export function VerificationForm({ email = '', displayName = '', next }: { email?: string; displayName?: string; next?: string }) {
  const router = useRouter();
  const [challengeId, setChallengeId] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [verified, setVerified] = useState(false);

  async function sendCode() {
    setMessage('인증번호를 요청하고 있습니다.');
    try {
      const response = await fetch('/api/phone/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const body = await response.json();
      if (!response.ok) {
        setMessage(
          body.error === 'provider_unavailable'
            ? '문자 인증 연결을 준비하고 있습니다. 현재는 가입을 완료할 수 없습니다.'
            : body.error === 'rate_limited'
              ? '인증번호를 이미 보냈습니다. 1분 뒤 다시 시도해 주세요.'
              : '전화번호를 확인하거나 잠시 후 다시 시도해 주세요.',
        );
        return;
      }
      setChallengeId(body.challengeId);
      setMessage(`${body.maskedPhone}로 인증번호를 보냈습니다.${body.developmentCode ? ` 개발용 번호: ${body.developmentCode}` : ''}`);
    } catch {
      setMessage('네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
  }

  async function verifyCode() {
    try {
      const response = await fetch('/api/phone/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challengeId, code }),
      });
      const body = await response.json();
      setVerified(response.ok);
      if (response.ok) {
        setMessage('휴대전화 인증이 완료됐습니다.');
        return;
      }
      const errorMessages: Record<string, string> = {
        expired: '인증번호가 만료됐습니다. 인증번호를 다시 받아 주세요.',
        expired_or_invalid_challenge: '인증번호가 만료됐습니다. 인증번호를 다시 받아 주세요.',
        attempts_exceeded: '인증 시도 횟수를 초과했습니다. 새 인증번호를 받아 주세요.',
        used: '이미 사용한 인증번호입니다. 새 인증번호를 받아 주세요.',
        mismatch: '인증번호가 맞지 않습니다.',
        provider_unavailable: '문자 인증 연결을 준비하고 있습니다. 현재는 가입을 완료할 수 없습니다.',
      };
      setMessage(errorMessages[body.error] ?? '인증번호를 확인해 주세요.');
    } catch {
      setVerified(false);
      setMessage('네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
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
      termsAccepted: true,
      privacyAccepted: true,
      ageOver14: true,
      marketingSmsAccepted: formData.get('marketingSmsAccepted') === 'on',
      marketingEmailAccepted: formData.get('marketingEmailAccepted') === 'on',
    });
    if (result.ok) {
      router.replace(next ?? '/onboarding/role');
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
        <legend className="px-2 font-semibold">필수 휴대전화 번호 인증</legend>
        <p className="text-sm leading-6 text-slate-600">이 번호 확인은 공인중개사 자격이나 집 소유권 인증이 아닙니다.</p>
        <label className="grid gap-2">전화번호<input className="rounded-xl border p-3" onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" type="tel" value={phone} /></label>
        <button className="rounded-xl bg-emerald-900 p-3 font-semibold text-white" onClick={sendCode} type="button">인증번호 받기</button>
        {challengeId && <><label className="grid gap-2">인증번호<input className="rounded-xl border p-3" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value)} value={code} /></label><button className="rounded-xl border border-emerald-900 p-3 font-semibold" onClick={verifyCode} type="button">인증하기</button></>}
      </fieldset>
      <label><input name="marketingSmsAccepted" type="checkbox" /> 문자 마케팅 수신 (선택)</label>
      <label><input name="marketingEmailAccepted" type="checkbox" /> 이메일 마케팅 수신 (선택)</label>
      <button className="min-h-12 rounded-xl bg-emerald-900 px-5 py-3 font-semibold text-white" type="submit">가입 완료</button>
      {message && <p aria-live="polite" className="rounded-xl bg-slate-100 p-4">{message}</p>}
    </form>
  );
}
