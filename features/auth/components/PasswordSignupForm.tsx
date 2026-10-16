'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { Check, Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { registerVerifiedPasswordAccountAction } from '@/features/auth/actions/register-verified-password-account';
import { authFieldClass, authInputClass, authLabelClass, authPrimaryButtonClass, authSecondaryButtonClass } from '@/features/auth/components/AuthCard';

// 2026-10-16 승인 시안 ⑤⑥: 1 계정 → 2 휴대폰 인증 → 3 동의, 한 화면에서 끝낸다.
const OTP_SECONDS = 5 * 60;
const PASSWORD_RULES = [
  { label: '8자 이상', test: (value: string) => value.length >= 8 },
  { label: '영문 소문자', test: (value: string) => /[a-z]/.test(value) },
  { label: '숫자', test: (value: string) => /[0-9]/.test(value) },
  { label: '특수문자', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];
const sectionTitle = 'mb-1 text-lg font-bold text-[#16211E]';
const helpText = 'text-sm leading-relaxed text-[#5D6A65]';

function formatSeconds(total: number) {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function PasswordSignupForm({ next }: { next?: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const usernameRef = useRef('');
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'unavailable' | 'invalid' | 'rate_limited' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [email, setEmail] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'>('idle');
  const [phoneMessage, setPhoneMessage] = useState('');
  const [phoneMessageIsError, setPhoneMessageIsError] = useState(false);
  const [otp, setOtp] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [otpLeft, setOtpLeft] = useState(0);
  const [formValid, setFormValid] = useState(false);
  const allRequired = termsAccepted && privacyAccepted;
  const passwordsMatch = passwordConfirm.length === 0 || password === passwordConfirm;
  const [actionState, formAction, isPending] = useActionState(registerVerifiedPasswordAccountAction, {});

  const accountDone = name.trim().length >= 2
    && usernameStatus === 'available'
    && PASSWORD_RULES.every((rule) => rule.test(password))
    && password === passwordConfirm
    && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const phoneDone = phoneStatus === 'verified';
  const steps = [
    { label: '계정', done: accountDone },
    { label: '휴대폰 인증', done: phoneDone },
    { label: '동의', done: allRequired },
  ];
  const currentStep = steps.findIndex((step) => !step.done);

  useEffect(() => {
    if (!actionState.error || !actionState.field) return;
    document.getElementById(actionState.field)?.focus();
  }, [actionState]);

  useEffect(() => {
    if (cooldown <= 0 && otpLeft <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((value) => Math.max(0, value - 1));
      setOtpLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldown, otpLeft]);

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
      setOtpLeft(OTP_SECONDS);
      setPhoneMessage(`${body.maskedPhone ?? '입력한 번호'}로 인증번호를 보냈습니다. 문자가 안 오면 1분 뒤 다시 받아 주세요.`);
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
      setOtpLeft(0);
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
  const usernameTone = usernameStatus === 'available' ? 'text-[#0B6655] font-semibold' : usernameStatus === 'idle' || usernameStatus === 'checking' ? 'text-[#5D6A65]' : 'text-[#8C1D18]';

  return (
    <form action={formAction} className="flex flex-col gap-7" onInput={refreshValidity} ref={formRef}>
      <ol aria-label="가입 단계" className="flex gap-2">
        {steps.map((step, index) => (
          <li aria-current={index === currentStep ? 'step' : undefined} className="flex flex-1 flex-col gap-1.5" key={step.label}>
            <span aria-hidden="true" className={`h-1 rounded-sm ${step.done || index === currentStep ? 'bg-[#0B6655]' : 'bg-[#E1E6E3]'}`} />
            <span className={`text-[13px] ${step.done ? 'font-semibold text-[#0B6655]' : index === currentStep ? 'font-semibold text-[#16211E]' : 'text-[#5D6A65]'}`}>
              {index + 1} {step.label}{step.done ? ' ✓' : ''}
            </span>
          </li>
        ))}
      </ol>

      {next && <input name="next" type="hidden" value={next} />}
      <input name="challengeId" type="hidden" value={phoneStatus === 'verified' ? challengeId : ''} />

      <fieldset className="flex min-w-0 flex-col gap-[18px]">
        <legend className={sectionTitle}>1. 계정 만들기</legend>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-name">이름</label>
          <div className={`${authFieldClass} px-4`}>
            <input aria-describedby="signup-name-help" autoComplete="name" className={authInputClass} id="signup-name" maxLength={30} minLength={2} name="name" onChange={(event) => setName(event.target.value)} placeholder="홍길동" required value={name} />
          </div>
          <p className={helpText} id="signup-name-help">비밀번호를 잊었을 때 휴대폰 인증과 함께 본인 확인에 써요.</p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-username">아이디</label>
          <div className="flex gap-2">
            <div className={`${authFieldClass} min-w-0 flex-1 px-4`}>
              <input aria-describedby="username-status" autoCapitalize="none" autoComplete="username" className={authInputClass} id="signup-username" maxLength={20} minLength={4} name="username" onChange={(event) => { usernameRef.current = event.target.value; setUsername(event.target.value); setUsernameStatus('idle'); }} placeholder="영문·숫자·밑줄 4~20자" required spellCheck={false} value={username} />
            </div>
            <button aria-label="아이디 중복 확인" className={authSecondaryButtonClass} disabled={!/^[a-z0-9_]{4,20}$/.test(username.trim().toLowerCase()) || usernameStatus === 'checking'} onClick={checkUsername} type="button">중복 확인</button>
          </div>
          {usernameMessage && <p aria-live="polite" className={`text-sm ${usernameTone}`} id="username-status">{usernameStatus === 'available' && <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />}{usernameMessage}</p>}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-password">비밀번호</label>
          <div className={`${authFieldClass} gap-1 pl-4 pr-1`}>
            <input aria-describedby="password-rule" autoComplete="new-password" className={authInputClass} id="signup-password" maxLength={128} minLength={8} name="password" onChange={(event) => setPassword(event.target.value)} pattern="(?=.*[a-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).{8,}" required type={showPassword ? 'text' : 'password'} value={password} />
            <button aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} aria-pressed={showPassword} className="inline-flex h-11 items-center gap-1.5 rounded-[10px] px-3 text-sm font-medium text-[#3E4B47] hover:bg-[#F6F7F5]" onClick={() => setShowPassword((value) => !value)} type="button">
              {showPassword ? <EyeOff aria-hidden="true" className="size-[18px]" /> : <Eye aria-hidden="true" className="size-[18px]" />}
              <span aria-hidden="true">{showPassword ? '숨기기' : '보기'}</span>
            </button>
          </div>
          <ul aria-label="영문 소문자·숫자·특수문자를 포함해 8자 이상" className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[13px]" id="password-rule">
            {PASSWORD_RULES.map((rule) => {
              const ok = rule.test(password);
              return <li className={ok ? 'text-[#0B6655]' : 'text-[#5D6A65]'} key={rule.label}>{ok ? '✓' : '○'} {rule.label}</li>;
            })}
          </ul>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-password-confirm">비밀번호 확인</label>
          <div className={`${authFieldClass} px-4 ${!passwordsMatch ? 'border-[#B3261E]!' : ''}`}>
            <input aria-describedby={!passwordsMatch ? 'password-confirm-error' : undefined} aria-invalid={!passwordsMatch} autoComplete="new-password" className={authInputClass} id="signup-password-confirm" maxLength={128} minLength={8} name="passwordConfirm" onChange={(event) => setPasswordConfirm(event.target.value)} required type={showPassword ? 'text' : 'password'} value={passwordConfirm} />
          </div>
          {!passwordsMatch && <p className="text-sm text-[#8C1D18]" id="password-confirm-error" role="alert">비밀번호가 서로 다릅니다.</p>}
          {passwordsMatch && passwordConfirm.length > 0 && <p className="text-sm font-semibold text-[#0B6655]">✓ 비밀번호가 같아요.</p>}
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-email">이메일</label>
          <div className={`${authFieldClass} px-4`}>
            <input aria-describedby="signup-email-help" autoComplete="email" className={authInputClass} id="signup-email" name="email" onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" required type="email" value={email} />
          </div>
          <p className={helpText} id="signup-email-help">아이디 찾기에만 써요. 로그인에는 쓰지 않아요.</p>
        </div>
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-3.5 border-t border-[#E1E6E3] pt-6">
        <legend className={`${sectionTitle} float-left w-full`}>2. 휴대폰 본인 확인</legend>
        <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
          <label className={authLabelClass} htmlFor="signup-phone">휴대폰 번호</label>
          <div className="flex gap-2">
            <div className={`${authFieldClass} min-w-0 flex-1 px-4`}>
              <input
                aria-describedby="phone-status"
                autoComplete="tel"
                className={authInputClass}
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
                  setOtpLeft(0);
                  refreshValidity();
                }}
                pattern="01[016789]-?[0-9]{3,4}-?[0-9]{4}"
                placeholder="010-1234-5678"
                required
                type="tel"
                value={phone}
              />
              {phoneDone && <Check aria-hidden="true" className="size-5 text-[#0B6655]" />}
            </div>
            {!phoneDone && (
              <button
                className={authSecondaryButtonClass}
                disabled={!/^01[016789]-?\d{3,4}-?\d{4}$/.test(phone) || phoneStatus === 'sending' || cooldown > 0}
                onClick={sendPhoneCode}
                type="button"
              >
                {phoneStatus === 'sending' ? <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" /> : null}
                {cooldown > 0 ? `${cooldown}초 후 다시 받기` : challengeId ? '인증번호 다시 받기' : '인증번호 받기'}
              </button>
            )}
          </div>
        </div>
        {challengeId && !phoneDone && (
          <div className="grid grid-cols-[minmax(0,1fr)] gap-2">
            <label className={authLabelClass} htmlFor="signup-otp">인증번호</label>
            <div className="flex gap-2">
              <div className={`${authFieldClass} min-w-0 flex-1 justify-between px-4`}>
                <input autoComplete="one-time-code" className={`${authInputClass} tracking-[4px] placeholder:tracking-normal`} id="signup-otp" inputMode="numeric" maxLength={6} onChange={(event) => setOtp(event.target.value.replace(/\D/g, ''))} pattern="[0-9]{6}" placeholder="숫자 6자리" value={otp} />
                {otpLeft > 0 && <span aria-label={`남은 시간 ${Math.floor(otpLeft / 60)}분 ${otpLeft % 60}초`} className="text-[15px] font-semibold text-[#8C1D18]">{formatSeconds(otpLeft)}</span>}
              </div>
              <button aria-label="인증 확인" className={`${authPrimaryButtonClass} px-5 text-[15px]`} disabled={otp.length !== 6 || phoneStatus === 'verifying'} onClick={verifyPhoneCode} type="button">확인</button>
            </div>
          </div>
        )}
        {phoneMessage && <p aria-live="polite" className={`text-sm ${phoneMessageIsError ? 'text-[#8C1D18]' : phoneDone ? 'font-semibold text-[#0B6655]' : 'text-[#3E4B47]'}`} id="phone-status" role={phoneMessageIsError ? 'alert' : undefined}>{phoneDone && <Check aria-hidden="true" className="mr-1 inline size-4 align-[-3px]" />}{phoneMessage}</p>}
      </fieldset>

      <fieldset className="flex min-w-0 flex-col gap-1 border-t border-[#E1E6E3] pt-6">
        <legend className={`${sectionTitle} float-left mb-2.5 w-full`}>3. 약관 동의</legend>
        <label className="flex min-h-12 items-center gap-3 rounded-xl bg-[#F6F7F5] px-3.5 text-base font-bold"><input checked={allRequired} className="size-5 accent-[#0B6655]" onChange={(event) => { setTermsAccepted(event.target.checked); setPrivacyAccepted(event.target.checked); refreshValidity(); }} type="checkbox" /> 필수 항목 전체 동의</label>
        <label className="flex min-h-12 items-center gap-3 px-3.5 text-[15px]"><input checked={termsAccepted} className="size-5 accent-[#0B6655]" name="termsAccepted" onChange={(event) => setTermsAccepted(event.target.checked)} required type="checkbox" /> [필수] 서비스 이용약관에 동의합니다.</label>
        <label className="flex min-h-12 items-center gap-3 px-3.5 text-[15px]"><input checked={privacyAccepted} className="size-5 accent-[#0B6655]" name="privacyAccepted" onChange={(event) => setPrivacyAccepted(event.target.checked)} required type="checkbox" /> [필수] 개인정보 수집·이용에 동의합니다.</label>
      </fieldset>

      <div className="flex flex-col gap-2.5">
        {actionState.error && <p className="rounded-xl border border-[#E8B4AE] bg-[#FDF3F2] p-4 text-[15px] font-semibold text-[#8C1D18]" id="signup-form-error" role="alert" tabIndex={-1}>{actionState.error}</p>}
        <button className={authPrimaryButtonClass} disabled={isPending || usernameStatus !== 'available' || !phoneDone || !allRequired || !formValid || !passwordsMatch} type="submit">
          {isPending && <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />}
          {isPending ? '가입하고 있어요…' : '회원가입 완료'}
        </button>
        {!(usernameStatus === 'available' && phoneDone && allRequired) && <p className="text-center text-sm text-[#5D6A65]">아이디 중복 확인, 휴대폰 인증, 필수 동의를 마치면 버튼이 켜져요.</p>}
      </div>
    </form>
  );
}
