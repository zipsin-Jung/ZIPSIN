'use client';

import { useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { registerPasswordAccountAction } from '@/features/auth/actions/register-password-account';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20';

export function PasswordSignupForm({ next }: { next?: string }) {
  const [username, setUsername] = useState('');
  const usernameRef = useRef('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'rate_limited' | 'error'>('idle');
  const [passwordPinned, setPasswordPinned] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const allRequired = termsAccepted && privacyAccepted;
  const showPassword = passwordPinned;

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
    <form action={registerPasswordAccountAction} className="grid gap-5">
      {next && <input name="next" type="hidden" value={next} />}
      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-username">아이디</label>
        <div className="mt-2 flex gap-2">
          <input aria-describedby="username-status" className={`${inputClass} mt-0`} id="signup-username" name="username" required autoComplete="username" minLength={4} maxLength={20} onChange={(event) => { usernameRef.current = event.target.value; setUsername(event.target.value); setUsernameStatus('idle'); }} placeholder="영문, 숫자, 밑줄 4~20자" value={username} />
          <button className="min-h-12 shrink-0 rounded-xl border border-emerald-700 px-4 font-bold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-50" disabled={!/^[a-z0-9_]{4,20}$/.test(username.trim().toLowerCase()) || usernameStatus === 'checking'} onClick={checkUsername} type="button">아이디 중복 확인</button>
        </div>
        {usernameMessage && <p aria-live="polite" className="mt-2 text-sm font-medium text-slate-600" id="username-status">{usernameMessage}</p>}
      </div>
      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-password">비밀번호</label>
        <span className="relative block">
          <input aria-describedby="password-rule" className={`${inputClass} pr-14`} id="signup-password" name="password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} pattern="(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" />
          <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="absolute bottom-1 right-1 flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => setPasswordPinned((value) => !value)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        </span>
        <span className="mt-2 block text-xs font-medium text-slate-500" id="password-rule">영문 소문자·숫자·특수문자를 포함해 8자 이상</span>
      </div>
      <label className="font-semibold text-slate-800">
        비밀번호 확인
        <input className={inputClass} name="passwordConfirm" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} />
      </label>
      <label className="font-semibold text-slate-800">
        이메일
        <input className={inputClass} name="email" required type="email" autoComplete="email" placeholder="계정 확인과 비밀번호 찾기에 사용합니다" />
      </label>

      <fieldset className="grid gap-3 rounded-2xl bg-[#f7faf8] p-4 text-sm text-slate-700">
        <legend className="px-1 font-bold text-slate-900">필수 동의</legend>
        <label className="flex min-h-11 items-center gap-3 border-b border-slate-200 pb-3 font-bold"><input checked={allRequired} onChange={(event) => { setTermsAccepted(event.target.checked); setPrivacyAccepted(event.target.checked); }} type="checkbox" /> 필수 항목 전체 동의</label>
        <label className="flex min-h-11 items-center gap-3"><input checked={termsAccepted} name="termsAccepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" /> 서비스 이용약관에 동의합니다.</label>
        <label className="flex min-h-11 items-center gap-3"><input checked={privacyAccepted} name="privacyAccepted" onChange={(event) => setPrivacyAccepted(event.target.checked)} required type="checkbox" /> 개인정보 수집·이용에 동의합니다.</label>
      </fieldset>

      <button className="min-h-13 rounded-xl bg-[#0d5b45] px-5 py-3 text-lg font-extrabold text-white transition hover:bg-[#084b39] disabled:cursor-not-allowed disabled:opacity-50" disabled={usernameStatus !== 'available' || !allRequired} type="submit">회원가입</button>
    </form>
  );
}
