'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { registerVerifiedPasswordAccountAction } from '@/features/auth/actions/register-verified-password-account';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20';

export function PasswordSignupForm({ next }: { next?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [username, setUsername] = useState('');
  const usernameRef = useRef('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'rate_limited' | 'error'>('idle');
  const [passwordPinned, setPasswordPinned] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'>('idle');
  const [phoneMessage, setPhoneMessage] = useState('');
  const [phoneMessageIsError, setPhoneMessageIsError] = useState(false);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [formValid, setFormValid] = useState(false);
  const allRequired = termsAccepted && privacyAccepted;
  const showPassword = passwordPinned;
  const passwordsMatch = passwordConfirm.length === 0 || password === passwordConfirm;
  const [actionState, formAction, isPending] = useActionState(registerVerifiedPasswordAccountAction, {});

  useEffect(() => {
    if (!actionState.error || !actionState.field) return;
    document.getElementById(actionState.field)?.focus();
  }, [actionState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  function refreshValidity() {
    queueMicrotask(() => setFormValid(formRef.current?.checkValidity() ?? false));
  }

  async function sendPhoneCode() {
    setPhoneStatus('sending');
    setPhoneMessageIsError(false);
    setPhoneMessage('인증번호를 보내고 있습니다.');
    try {
      const response = await fetch('/api/auth/signup/phone/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }),
      });
      const body = await response.json() as { ok?: boolean; challengeId?: string; maskedPhone?: string; error?: string };
      if (!response.ok || !body.ok || !body.challengeId) {
        setPhoneStatus('error');
        setPhoneMessageIsError(true);
        setPhoneMessage(body.error === 'rate_limited' ? '요청이 많습니다. 잠시 후 다시 시도해 주세요.' : '현재 인증문자를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.');
        return;
      }
      setChallengeId(body.challengeId);
      setOtp('');
      setPhoneStatus('sent');
      setPhoneMessageIsError(false);
      setCooldown(60);
      setPhoneMessage(`${body.maskedPhone ?? '입력한 번호'}로 인증번호를 보냈습니다.`);
    } catch {
      setPhoneStatus('error');
      setPhoneMessageIsError(true);
      setPhoneMessage('현재 인증문자를 보낼 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  async function verifyPhoneCode() {
    setPhoneStatus('verifying');
    setPhoneMessageIsError(false);
    setPhoneMessage('인증번호를 확인하고 있습니다.');
    try {
      const response = await fetch('/api/auth/signup/phone/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code: otp }),
      });
      const body = await response.json() as { ok?: boolean; error?: string };
      if (!response.ok || !body.ok) {
        setPhoneStatus('sent');
        setPhoneMessageIsError(true);
        setPhoneMessage(body.error === 'expired' ? '인증번호가 만료되었습니다. 다시 받아 주세요.' : body.error === 'attempts_exceeded' ? '입력 횟수를 초과했습니다. 인증번호를 다시 받아 주세요.' : '인증번호가 맞지 않습니다. 다시 확인해 주세요.');
        return;
      }
      setPhoneStatus('verified');
      setPhoneMessageIsError(false);
      setPhoneMessage('휴대폰 인증이 완료되었습니다.');
      refreshValidity();
    } catch {
      setPhoneStatus('sent');
      setPhoneMessageIsError(true);
      setPhoneMessage('현재 인증번호를 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  async function checkUsername() {
    const requestedUsername = username.trim().toLowerCase();
    setUsernameStatus('checking');
    try {
      const response = await fetch('/api/auth/username-availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const body = await response.json() as { status?: string };
      if (requestedUsername !== usernameRef.current.trim().toLowerCase()) return;
      const status = body.status;
      setUsernameStatus(
        status === 'available' || status === 'unavailable' || status === 'invalid' || status === 'rate_limited'
          ? status
          : 'error',
      );
    } catch {
      setUsernameStatus('error');
    }
  }

  const usernameMessage = {
    idle: username ? '아이디 중복 확인이 필요합니다.' : '',
    checking: '아이디를 확인하고 있습니다.',
    available: '사용할 수 있는 아이디입니다.',
    unavailable: '이미 사용 중인 아이디입니다.',
    invalid: '영문 소문자·숫자·밑줄 4~20자로 입력해 주세요.',
    rate_limited: '확인 요청이 많습니다. 잠시 후 다시 시도해 주세요.',
    error: '지금 확인할 수 없습니다. 잠시 후 다시 시도해 주세요.',
  }[usernameStatus];

  return (
    <form action={formAction} className="grid gap-5" onInput={refreshValidity} ref={formRef}>
      {next && <input name="next" type="hidden" value={next} />}
      <input name="challengeId" type="hidden" value={phoneStatus === 'verified' ? challengeId : ''} />
      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-username">아이디</label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <input aria-describedby="username-status" className={`${inputClass} mt-0 min-w-0`} id="signup-username" name="username" required autoComplete="username" minLength={4} maxLength={20} onChange={(event) => { usernameRef.current = event.target.value; setUsername(event.target.value); setUsernameStatus('idle'); }} placeholder="영문, 숫자, 밑줄 4~20자" value={username} />
          <button className="min-h-12 shrink-0 rounded-xl border border-emerald-700 px-4 font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!/^[a-z0-9_]{4,20}$/.test(username.trim().toLowerCase()) || usernameStatus === 'checking'} onClick={checkUsername} type="button">아이디 중복 확인</button>
        </div>
        {usernameMessage && <p aria-live="polite" className="mt-2 text-sm font-medium text-slate-600" id="username-status">{usernameMessage}</p>}
      </div>
      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-password">비밀번호</label>
        <span className="relative block">
          <input aria-describedby="password-rule" className={`${inputClass} pr-14`} id="signup-password" name="password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} pattern="(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" onChange={(event) => setPassword(event.target.value)} value={password} />
          <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="absolute bottom-1 right-1 flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => setPasswordPinned((value) => !value)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        </span>
        <span className="mt-2 block text-xs font-medium text-slate-500" id="password-rule">영문 소문자·숫자·특수문자를 포함해 8자 이상</span>
      </div>
      <label className="font-semibold text-slate-800">
        비밀번호 확인
        <input aria-describedby={!passwordsMatch ? 'password-confirm-error' : undefined} aria-invalid={!passwordsMatch} className={inputClass} id="signup-password-confirm" name="passwordConfirm" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} onChange={(event) => setPasswordConfirm(event.target.value)} value={passwordConfirm} />
        {!passwordsMatch && <span className="mt-2 block text-sm text-red-700" id="password-confirm-error" role="alert">비밀번호가 서로 다릅니다.</span>}
      </label>
      <label className="font-semibold text-slate-800">
        이메일
        <input className={inputClass} id="signup-email" name="email" required type="email" autoComplete="email" placeholder="계정 확인과 비밀번호 찾기에 사용합니다" />
      </label>

      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-phone">휴대폰 번호</label>
        <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
          <input
            aria-describedby="phone-status"
            autoComplete="tel"
            className={`${inputClass} mt-0`}
            id="signup-phone"
            inputMode="tel"
            onChange={(event) => {
              setPhone(event.target.value);
              setChallengeId('');
              setOtp('');
              setPhoneStatus('idle');
              setPhoneMessage('');
              setPhoneMessageIsError(false);
              setCooldown(0);
              refreshValidity();
            }}
            pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}"
            placeholder="010-1234-5678"
            required
            type="tel"
            value={phone}
          />
          <button
            className="min-h-12 rounded-xl border border-emerald-700 px-4 font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) || phoneStatus === 'sending' || phoneStatus === 'verified' || cooldown > 0}
            onClick={sendPhoneCode}
            type="button"
          >
            {cooldown > 0 ? `${cooldown}초 후 다시 받기` : challengeId ? '인증번호 다시 받기' : '인증번호 받기'}
          </button>
        </div>
        {challengeId && phoneStatus !== 'verified' && (
          <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]">
            <label className="sr-only" htmlFor="signup-otp">인증번호</label>
            <input autoComplete="one-time-code" className={`${inputClass} mt-0`} id="signup-otp" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} pattern="[0-9]{6}" placeholder="인증번호 6자리" value={otp} />
            <button className="min-h-12 rounded-xl bg-emerald-700 px-5 font-bold text-white disabled:opacity-50" disabled={otp.length !== 6 || phoneStatus === 'verifying'} onClick={verifyPhoneCode} type="button">인증 확인</button>
          </div>
        )}
        {phoneMessage && <p aria-live="polite" className={`mt-2 text-sm font-medium ${phoneMessageIsError ? 'text-red-700' : phoneStatus === 'verified' ? 'text-emerald-700' : 'text-slate-600'}`} id="phone-status" role={phoneMessageIsError ? 'alert' : undefined}>{phoneMessage}</p>}
      </div>

      <fieldset className="grid gap-3 rounded-2xl bg-[#f7faf8] p-4 text-sm text-slate-700">
        <legend className="px-1 font-bold text-slate-900">필수 동의</legend>
        <label className="flex min-h-11 items-center gap-3 border-b border-slate-200 pb-3 font-bold"><input checked={allRequired} onChange={(event) => { setTermsAccepted(event.target.checked); setPrivacyAccepted(event.target.checked); }} type="checkbox" /> 필수 항목 전체 동의</label>
        <label className="flex min-h-11 items-center gap-3"><input checked={termsAccepted} name="termsAccepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" /> 서비스 이용약관에 동의합니다.</label>
        <label className="flex min-h-11 items-center gap-3"><input checked={privacyAccepted} name="privacyAccepted" onChange={(event) => setPrivacyAccepted(event.target.checked)} required type="checkbox" /> 개인정보 수집·이용에 동의합니다.</label>
      </fieldset>

      {actionState.error && <p className="rounded-xl bg-red-50 p-4 font-semibold text-red-800" id="signup-form-error" role="alert" tabIndex={-1}>{actionState.error}</p>}
      <button className="min-h-13 rounded-xl bg-[#0d5b45] px-5 py-3 text-lg font-extrabold text-white transition hover:bg-[#084b39] disabled:cursor-not-allowed disabled:opacity-50" disabled={isPending || usernameStatus !== 'available' || phoneStatus !== 'verified' || !allRequired || !formValid || !passwordsMatch} type="submit">{isPending ? '가입 처리 중…' : '회원가입 완료'}</button>
    </form>
  );
}
