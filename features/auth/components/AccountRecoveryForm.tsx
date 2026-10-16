'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { CircleAlert, LoaderCircle } from 'lucide-react';
import { authFieldClass, authInputClass, authLabelClass, authPrimaryButtonClass, authSecondaryButtonClass } from '@/features/auth/components/AuthCard';

type Tab = 'username' | 'password';
type FoundAccount = { maskedUsername: string; createdAt: string | null };

const OTP_SECONDS = 5 * 60;
const intro = 'text-base leading-relaxed text-[#3E4B47]';
const errorBox = 'flex items-start gap-3 rounded-xl border border-[#E8B4AE] bg-[#FDF3F2] p-4 text-[15px] leading-relaxed text-[#8C1D18]';

function formatDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
}

function UsernameFinder() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'found' | 'not_found' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [accounts, setAccounts] = useState<FoundAccount[]>([]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState('loading');
    try {
      const response = await fetch('/api/auth/recovery/username', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const body = await response.json() as { status?: string; accounts?: FoundAccount[] };
      if (body.status === 'found' && body.accounts?.length) { setAccounts(body.accounts); setState('found'); return; }
      if (body.status === 'not_found') { setState('not_found'); return; }
      setState('error');
      setMessage(body.status === 'rate_limited' ? '찾기 요청이 많아요. 잠시 후 다시 시도해 주세요.'
        : body.status === 'invalid_email' ? '이메일 형식을 확인해 주세요.'
          : '지금은 찾을 수 없어요. 잠시 후 다시 시도해 주세요.');
    } catch {
      setState('error');
      setMessage('네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
  }

  return (
    <form className="flex flex-col gap-[18px]" onSubmit={submit}>
      <p className={intro}>가입할 때 적은 이메일을 넣으면 아이디를 바로 보여 드려요.</p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="find-email">가입한 이메일</label>
        <div className={`${authFieldClass} px-4 ${state === 'not_found' ? 'border-2 border-[#B3261E]!' : ''}`}>
          <input aria-invalid={state === 'not_found'} autoComplete="email" className={authInputClass} id="find-email" onChange={(event) => { setEmail(event.target.value); if (state !== 'loading') setState('idle'); }} placeholder="name@example.com" required type="email" value={email} />
        </div>
      </div>
      <button className={authPrimaryButtonClass} disabled={state === 'loading'} type="submit">
        {state === 'loading' && <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />}
        {state === 'loading' ? '찾고 있어요…' : state === 'not_found' ? '다시 찾기' : '아이디 찾기'}
      </button>
      <div aria-live="polite">
        {state === 'found' && (
          <div className="flex flex-col gap-3 rounded-xl bg-[#EAF2EF] p-4" role="status">
            <p className="text-sm text-[#3E4B47]">이 이메일로 가입된 아이디</p>
            {accounts.map((account) => (
              <div key={`${account.maskedUsername}-${account.createdAt ?? ''}`}>
                <p className="text-[22px] font-bold tracking-[1px] text-[#16211E]">{account.maskedUsername}</p>
                {formatDate(account.createdAt) && <p className="text-[13px] text-[#5D6A65]">가입일 {formatDate(account.createdAt)}</p>}
              </div>
            ))}
            <p className="text-[13px] leading-relaxed text-[#5D6A65]">안전을 위해 일부를 가렸어요.</p>
            <Link className={authPrimaryButtonClass} href="/login">이 아이디로 로그인하기</Link>
            <a className="inline-flex min-h-11 items-center justify-center text-sm font-medium text-[#0B6655]! underline! underline-offset-[3px]" href="/account-recovery?tab=password">비밀번호도 기억나지 않아요</a>
          </div>
        )}
        {state === 'not_found' && (
          <div className="flex flex-col gap-3">
            <div className={errorBox} role="alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <p>이 이메일로 가입된 아이디가 없어요. 오타가 없는지 확인하고 다시 찾아 주세요.</p>
            </div>
            <p className="text-center text-sm text-[#5D6A65]">다른 이메일로 가입했을 수도 있어요. 아직 가입 전이라면 <Link className="font-semibold text-[#0B6655]! underline! underline-offset-[3px]" href="/signup">회원가입</Link></p>
          </div>
        )}
        {state === 'error' && <div className={errorBox} role="alert"><CircleAlert aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>{message}</p></div>}
      </div>
    </form>
  );
}

function PasswordReset() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified'>('idle');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [left, setLeft] = useState(0);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (left <= 0 && cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setLeft((value) => Math.max(0, value - 1));
      setCooldown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [left, cooldown]);

  function reset() {
    setChallengeId(''); setCode(''); setStatus('idle'); setMessage(''); setIsError(false); setLeft(0); setCooldown(0);
  }

  async function sendCode() {
    setStatus('sending'); setIsError(false); setMessage('인증번호를 보내고 있어요.');
    try {
      const response = await fetch('/api/auth/recovery/phone/send', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, name, phone }),
      });
      const body = await response.json() as { ok?: boolean; challengeId?: string; maskedPhone?: string; error?: string };
      if (response.ok && body.ok && body.challengeId) {
        setChallengeId(body.challengeId); setCode(''); setStatus('sent'); setLeft(OTP_SECONDS); setCooldown(60);
        setMessage(`${body.maskedPhone ?? '입력한 번호'}로 인증번호를 보냈어요.`);
        return;
      }
      setStatus(challengeId ? 'sent' : 'idle'); setIsError(true);
      setMessage(body.error === 'not_found' ? '이메일·이름·휴대폰 번호가 모두 맞는 계정이 없어요. 가입할 때 적은 그대로 넣어 주세요.'
        : response.status === 429 || body.error === 'rate_limited' ? '요청이 많아요. 잠시 후 다시 시도해 주세요.'
          : '지금은 인증문자를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.');
    } catch {
      setStatus(challengeId ? 'sent' : 'idle'); setIsError(true); setMessage('네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
  }

  async function verifyCode() {
    setStatus('verifying'); setIsError(false); setMessage('인증번호를 확인하고 있어요.');
    try {
      const response = await fetch('/api/auth/recovery/phone/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ challengeId, code }),
      });
      const body = await response.json() as { ok?: boolean; resetReady?: boolean; error?: string };
      if (response.ok && body.ok && body.resetReady) {
        setStatus('verified'); setLeft(0); setMessage('본인 확인이 끝났어요. 새 비밀번호를 만드는 화면으로 이동해요.');
        window.location.assign('/reset-password');
        return;
      }
      setStatus('sent'); setIsError(true);
      setMessage(body.error === 'expired' ? '인증번호가 만료됐어요. 다시 받아 주세요.'
        : body.error === 'attempts_exceeded' ? '입력 횟수를 넘었어요. 인증번호를 다시 받아 주세요.'
          : '인증번호가 맞지 않아요. 다시 확인해 주세요.');
    } catch {
      setStatus('sent'); setIsError(true); setMessage('네트워크 연결을 확인하고 다시 시도해 주세요.');
    }
  }

  const canSend = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && name.trim().length >= 2 && /^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) && status !== 'sending' && status !== 'verified' && cooldown <= 0;

  return (
    <div className="flex flex-col gap-[18px]">
      <p className={intro}>가입한 이메일·이름·휴대폰 번호가 모두 맞으면 문자로 본인 확인을 하고 새 비밀번호를 다시 정할 수 있어요. 아이디가 기억나지 않아도 괜찮아요.</p>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="reset-email">가입한 이메일</label>
        <div className={`${authFieldClass} px-4`}>
          <input autoCapitalize="none" autoComplete="email" className={authInputClass} id="reset-email" maxLength={254} onChange={(event) => { setEmail(event.target.value); reset(); }} placeholder="name@example.com" spellCheck={false} type="email" value={email} />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="reset-name">이름</label>
        <div className={`${authFieldClass} px-4`}>
          <input autoComplete="name" className={authInputClass} id="reset-name" maxLength={30} onChange={(event) => { setName(event.target.value); reset(); }} placeholder="홍길동" value={name} />
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
        <label className={authLabelClass} htmlFor="reset-phone">휴대폰 번호</label>
        <div className="flex gap-2">
          <div className={`${authFieldClass} min-w-0 flex-1 px-4`}>
            <input autoComplete="tel" className={authInputClass} id="reset-phone" inputMode="tel" onChange={(event) => { setPhone(event.target.value); reset(); }} placeholder="010-1234-5678" type="tel" value={phone} />
          </div>
          <button className={authSecondaryButtonClass} disabled={!canSend} onClick={sendCode} type="button">
            {status === 'sending' && <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />}
            {cooldown > 0 ? `${cooldown}초 후 다시` : challengeId ? '다시 받기' : '인증번호 받기'}
          </button>
        </div>
      </div>
      {challengeId && status !== 'verified' && (
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="reset-code">인증번호 6자리</label>
          <div className="flex gap-2">
            <div className={`${authFieldClass} min-w-0 flex-1 justify-between px-4`}>
              <input autoComplete="one-time-code" className={`${authInputClass} tracking-[4px] placeholder:tracking-normal`} id="reset-code" inputMode="numeric" maxLength={6} onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))} placeholder="문자로 받은 번호" value={code} />
              {left > 0 && <span aria-label={`남은 시간 ${Math.floor(left / 60)}분 ${left % 60}초`} className="text-sm font-semibold text-[#8C1D18]">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
            </div>
            <button aria-label="인증번호 확인" className={`${authPrimaryButtonClass} px-5 text-[15px]`} disabled={code.length !== 6 || status === 'verifying'} onClick={verifyCode} type="button">확인</button>
          </div>
        </div>
      )}
      {message && (
        <p aria-live="polite" className={`text-sm leading-relaxed ${isError ? 'text-[#8C1D18]' : status === 'verified' ? 'font-semibold text-[#0B6655]' : 'text-[#3E4B47]'}`} role={isError ? 'alert' : 'status'}>{message}</p>
      )}
    </div>
  );
}

export function AccountRecoveryForm({ initialTab = 'username' }: { initialTab?: Tab }) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const tabClass = (active: boolean) => `min-h-11 rounded-[10px] text-[15px] transition ${active ? 'bg-white font-bold text-[#16211E] shadow-[0_1px_3px_rgba(22,33,30,0.12)]' : 'font-medium text-[#5D6A65] hover:text-[#16211E]'}`;
  return (
    <div className="flex flex-col gap-6">
      <div aria-label="찾을 항목" className="grid grid-cols-2 rounded-xl bg-[#F1F3F1] p-1" role="tablist">
        <button aria-controls="find-panel" aria-selected={tab === 'username'} className={tabClass(tab === 'username')} id="tab-username" onClick={() => setTab('username')} role="tab" type="button">아이디 찾기</button>
        <button aria-controls="find-panel" aria-selected={tab === 'password'} className={tabClass(tab === 'password')} id="tab-password" onClick={() => setTab('password')} role="tab" type="button">비밀번호 재설정</button>
      </div>
      <div aria-labelledby={tab === 'username' ? 'tab-username' : 'tab-password'} id="find-panel" role="tabpanel">
        {tab === 'username' ? <UsernameFinder /> : <PasswordReset />}
      </div>
    </div>
  );
}
