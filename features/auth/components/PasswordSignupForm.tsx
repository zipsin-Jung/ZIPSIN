'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { registerPasswordAccountAction } from '@/features/auth/actions/register-password-account';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20';

export function PasswordSignupForm({ next }: { next?: string }) {
  const [passwordPinned, setPasswordPinned] = useState(false);
  const [passwordHovered, setPasswordHovered] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const allRequired = termsAccepted && privacyAccepted;
  const showPassword = passwordPinned || passwordHovered;

  return (
    <form action={registerPasswordAccountAction} className="grid gap-5">
      {next && <input name="next" type="hidden" value={next} />}
      <label className="font-semibold text-slate-800">
        아이디
        <input className={inputClass} name="username" required autoComplete="username" minLength={4} maxLength={20} placeholder="영문, 숫자, 밑줄 4~20자" />
      </label>
      <div className="font-semibold text-slate-800">
        <label htmlFor="signup-password">비밀번호</label>
        <span className="relative block">
          <input aria-describedby="password-rule" className={`${inputClass} pr-14`} id="signup-password" name="password" required type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} maxLength={128} pattern="(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" />
          <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="absolute bottom-1 right-1 flex min-h-10 min-w-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-emerald-700" onClick={() => setPasswordPinned((value) => !value)} onMouseEnter={() => setPasswordHovered(true)} onMouseLeave={() => setPasswordHovered(false)} type="button">
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

      <button className="min-h-13 rounded-xl bg-[#0d5b45] px-5 py-3 text-lg font-extrabold text-white transition hover:bg-[#084b39]" type="submit">회원가입</button>
    </form>
  );
}
