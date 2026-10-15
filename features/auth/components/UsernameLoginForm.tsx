'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

type Props = { next?: string };

export function UsernameLoginForm({ next }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  async function submit(formData: FormData) { await loginWithUsernameAction(formData, next); }

  return (
    <form action={submit} className="grid gap-5">
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#40564f]" htmlFor="username">아이디 · 이메일 · 전화번호</label>
        <input autoComplete="username" className="min-h-16 w-full rounded-2xl border border-[#cfdad3] bg-white px-5 text-base outline-none transition placeholder:text-[#a8b3ae] focus:border-[#0f5c45] focus:ring-4 focus:ring-[#0f5c45]/10" id="username" minLength={4} maxLength={254} name="username" placeholder="아이디 · 이메일 · 전화번호" required />
      </div>
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#40564f]" htmlFor="password">비밀번호</label>
        <div className="flex min-h-16 items-center rounded-2xl border border-[#cfdad3] bg-white px-5 focus-within:border-[#0f5c45] focus-within:ring-4 focus-within:ring-[#0f5c45]/10">
          <input autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none placeholder:text-[#a8b3ae]" id="password" minLength={8} maxLength={128} name="password" placeholder="비밀번호" required type={showPassword ? 'text' : 'password'} />
          <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="grid size-11 place-items-center rounded-xl" onClick={() => setShowPassword((value) => !value)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>
      <label className="flex min-h-11 cursor-pointer items-center gap-3 text-base font-semibold text-[#536760]">
        <input className="size-5 accent-[#0b543f]" defaultChecked name="remember" type="checkbox" />
        로그인 유지
      </label>
      <button className="min-h-14 rounded-2xl bg-[#0b543f] px-5 text-lg font-extrabold text-white shadow-[0_10px_22px_rgba(11,84,63,0.18)] transition hover:-translate-y-0.5 hover:bg-[#084b39] active:scale-[0.99] motion-reduce:transform-none" type="submit">로그인</button>
    </form>
  );
}
