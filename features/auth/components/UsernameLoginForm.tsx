'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { loginWithUsernameAction } from '@/features/auth/actions/login-with-username';

type Props = { next?: string; hasError?: boolean; describedBy?: string };

const LAST_USERNAME_KEY = 'zipsin:last-login-username';
/** DEC-037: '아이디 저장'을 켜면 이 기기에만 아이디를 남긴다. 비밀번호는 저장하지 않는다(휴대폰 비밀번호 저장 기능에 맡김). */
export const SAVED_ID_KEY = 'zipsin:saved-login-id';

function readSavedId(): string {
  try {
    return window.localStorage.getItem(SAVED_ID_KEY) ?? '';
  } catch {
    return '';
  }
}

function writeSavedId(value: string | null) {
  try {
    if (value) window.localStorage.setItem(SAVED_ID_KEY, value);
    else window.localStorage.removeItem(SAVED_ID_KEY);
  } catch {
    // 저장소를 쓸 수 없는 브라우저(사생활 보호 모드 등)에서도 로그인은 계속한다.
  }
}

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
  const [saveId, setSaveId] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(true);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = readSavedId();
    if (saved) {
      setSaveId(true);
      setUsername(saved);
    }
    if (!hasError && !saved) return;
    if (hasError) {
      const last = readLastUsername();
      if (last) setUsername(last);
    }
    passwordRef.current?.focus();
  }, [hasError]);

  async function submit(formData: FormData) {
    const id = String(formData.get('username') ?? '').trim();
    rememberUsername(id);
    writeSavedId(saveId ? id : null);
    await loginWithUsernameAction(formData, next);
  }

  return (
    <form action={submit} aria-describedby={describedBy} className="grid gap-[18px]">
      <input name="remember_choice" type="hidden" value="1" />
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
      </div>
      <div className="grid gap-0.5">
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] text-[#212124]">
          <input checked={saveId} className="size-[22px] accent-[#0B6655]" onChange={(event) => setSaveId(event.target.checked)} type="checkbox" />
          아이디 저장
        </label>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-[15px] text-[#212124]">
          <input aria-describedby="keep-signed-in-hint" checked={keepSignedIn} className="size-[22px] accent-[#0B6655]" name="remember" onChange={(event) => setKeepSignedIn(event.target.checked)} type="checkbox" />
          이 기기에서 30일 동안 로그인 유지
        </label>
        <p className="pl-8 text-sm leading-normal text-[#6B7079]" id="keep-signed-in-hint">{keepSignedIn ? '사무소 공용 PC에서는 끄세요.' : '브라우저를 닫으면 로그아웃돼요.'}</p>
        <div className="flex justify-end">
          <Link className="inline-flex min-h-11 items-center text-sm font-medium text-[#0B6655]! underline! underline-offset-[3px]" href="/account-recovery">아이디·비밀번호 찾기</Link>
        </div>
      </div>
      <SubmitButton />
      <p className="text-center text-sm leading-relaxed text-[#6B7079]">비밀번호는 집신이 저장하지 않아요. 휴대폰이 &ldquo;비밀번호 저장&rdquo;을 물으면 저장해 두세요.</p>
    </form>
  );
}
