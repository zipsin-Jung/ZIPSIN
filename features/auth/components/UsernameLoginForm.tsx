'use client';

import { useState } from 'react';
import { Eye, EyeOff, LockKeyhole, UserRound } from 'lucide-react';
import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

type Props = { next?: string };

export function UsernameLoginForm({ next }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  async function submit(formData: FormData) { await loginWithUsernameAction(formData, next); }

  return (
    <form action={submit} className="grid gap-5">
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#173e32]" htmlFor="username">아이디</label>
        <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#cfdad3] bg-white px-4 focus-within:border-[#0f5c45] focus-within:ring-4 focus-within:ring-[#0f5c45]/10">
          <UserRound aria-hidden="true" className="size-5 text-[#789087]" />
          <input autoComplete="username" className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none" id="username" minLength={4} maxLength={20} name="username" placeholder="아이디를 입력하세요" required />
        </div>
      </div>
      <div>
        <label className="mb-2 block text-[15px] font-bold text-[#173e32]" htmlFor="password">비밀번호</label>
        <div className="flex min-h-14 items-center gap-3 rounded-2xl border border-[#cfdad3] bg-white px-4 focus-within:border-[#0f5c45] focus-within:ring-4 focus-within:ring-[#0f5c45]/10">
          <LockKeyhole aria-hidden="true" className="size-5 text-[#789087]" />
          <input autoComplete="current-password" className="min-w-0 flex-1 bg-transparent py-4 text-base outline-none" id="password" minLength={8} maxLength={128} name="password" required type={showPassword ? 'text' : 'password'} />
          <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="grid size-11 place-items-center rounded-xl" onClick={() => setShowPassword((value) => !value)} type="button">
            {showPassword ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        </div>
      </div>
      <button className="min-h-14 rounded-2xl bg-[#0b543f] px-5 text-base font-bold text-white" type="submit">로그인</button>
    </form>
  );
}
