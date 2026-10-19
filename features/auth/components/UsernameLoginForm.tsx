'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

type Props = { next?: string; hasError?: boolean; describedBy?: string };

const LAST_USERNAME_KEY = 'zipsin:last-login-username';

function readLastUsername(): string {
  try {
    return window.sessionStorage.getItem(LAST_USERNAME_KEY) ?? '';
  } catch {
    return '';
  }
}

function rememberUsername(value: string) {
  try {
    window.sessionStorage.setItem(LAST_USERNAME_KEY, value);
  } catch {
    // 저장소를 쓸 수 없는 브라우저에서도 로그인은 계속한다.
  }
}

const fieldClass = 'flex h-[52px] items-center rounded-xl border border-[#8A9792] bg-white focus-within:border-[#0B6655] focus-within:ring-[3px] focus-within:ring-[#0B6655]/15';
const inputClass = 'min-w-0 flex-1 bg-transparent text-base text-[#212124] outline-none placeholder:text-[#7A8681] focus-visible:outline-none!';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <>
      <button
        aria-disabled={pending}
        className="flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#0B6655] px-5 text-base font-semibold text-white transition hover:bg-[#083E37] disabled:cursor-progress disabled:bg-[#3F7F72]"
        disabled={pending}
        type="submit"
      >
        {pending && <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />}
        {pending ? '로그인하고 있어요…' : '로그인'}
      </button>
      <p role="status" className="sr-only">{pending ? '로그인하고 있습니다. 잠시만 기다려 주세요.' : ''}</p>
    </>
  );
}

export function UsernameLoginForm({ next, hasError = false, describedBy }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!hasError) return;
    const last = readLastUsername();
    if (last) setUsername(last);
    passwordRef.current?.focus();
  }, [hasError]);

  async function submit(formData: FormData) {
    rememberUsername(String(formData.get('username') ?? ''));
    await loginWithUsernameAction(formData, next);
  }

  return (
    <form action={submit} aria-describedby={describedBy} className="grid gap-[18px]">
      <div className="grid gap-2">
        <label className="text-[15px] font-semibold text-[#212124]" htmlFor="username">아이디</label>
        <div className={`${fieldClass} px-4`}>
          <input
            autoCapitalize="none"
            autoComplete="username"
            className={inputClass}
            id="username"
            maxLength={20}
            minLength={4}
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            placeholder="아이디"
            required
            spellCheck={false}
            value={username}
          />
        </div>
      </div>
      <div className="grid gap-2">
        <label className="text-[15px] font-semibold text-[#212124]" htmlFor="password">비밀번호</label>
        <div className={`${fieldClass} gap-1 pl-4 pr-1`}>
          <input
            autoComplete="current-password"
            className={inputClass}
            id="password"
            maxLength={128}
            minLength={8}
            name="password"
            placeholder="비밀번호"
            ref={passwordRef}
            required
            type={showPassword ? 'text' : 'password'}
          />
          <button
            aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-pressed={showPassword}
            className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-[#4D5159] hover:bg-[#F6F7F5]"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
            <span aria-hidden="true">{showPassword ? '숨기기' : '보기'}</span>
          </button>
        </div>
        <div className="flex justify-end">
          <Link className="inline-flex min-h-11 items-center text-sm font-medium text-[#0B6655]! underline! underline-offset-[3px]" href="/account-recovery">아이디·비밀번호 찾기</Link>
        </div>
      </div>
      <SubmitButton />
    </form>
  );
}
