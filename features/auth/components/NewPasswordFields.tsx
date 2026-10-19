'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { authFieldClass, authInputClass, authLabelClass, authPrimaryButtonClass } from '@/features/auth/components/AuthCard';

const RULES = [
  { label: '8자 이상', test: (value: string) => value.length >= 8 },
  { label: '영문 소문자', test: (value: string) => /[a-z]/.test(value) },
  { label: '숫자', test: (value: string) => /[0-9]/.test(value) },
  { label: '특수문자', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function Submit({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className={authPrimaryButtonClass} disabled={disabled || pending} type="submit">
      {pending && <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />}
      {pending ? '바꾸고 있어요…' : '비밀번호 바꾸기'}
    </button>
  );
}

/** 새 비밀번호 + 확인 칸(회원가입과 같은 조건 표시). */
export function NewPasswordFields() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const allOk = RULES.every((rule) => rule.test(password));
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="new-password">새 비밀번호</label>
        <div className={`${authFieldClass} gap-1 pl-4 pr-1`}>
          <input aria-describedby="new-password-rule" autoComplete="new-password" className={authInputClass} id="new-password" maxLength={128} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} required type={show ? 'text' : 'password'} value={password} />
          <button aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={show} className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-[#4D5159] hover:bg-[#F6F7F5]" onClick={() => setShow((value) => !value)} type="button">
            {show ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
            <span aria-hidden="true">{show ? '숨기기' : '보기'}</span>
          </button>
        </div>
        <ul aria-label="영문 소문자·숫자·특수문자를 포함해 8자 이상" className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px]" id="new-password-rule">
          {RULES.map((rule) => {
            const ok = rule.test(password);
            return <li className={ok ? 'text-[#0B6655]' : 'text-[#6B7079]'} key={rule.label}>{ok ? '✓' : '○'} {rule.label}</li>;
          })}
        </ul>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="new-password-confirm">새 비밀번호 확인</label>
        <div className={`${authFieldClass} px-4 ${mismatch ? 'border-[#B3261E]!' : ''}`}>
          <input aria-invalid={mismatch} autoComplete="new-password" className={authInputClass} id="new-password-confirm" maxLength={128} minLength={8} name="passwordConfirm" onChange={(event) => setConfirm(event.target.value)} required type={show ? 'text' : 'password'} value={confirm} />
        </div>
        {mismatch && <p className="text-sm text-[#8C1D18]" role="alert">비밀번호가 서로 다릅니다.</p>}
      </div>
      <Submit disabled={!allOk || confirm !== password} />
    </>
  );
}
