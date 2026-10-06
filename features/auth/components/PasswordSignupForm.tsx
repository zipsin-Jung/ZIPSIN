import { registerPasswordAccountAction } from '@/features/auth/actions/register-password-account';

const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-base text-slate-950 outline-none transition focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20';

export function PasswordSignupForm() {
  return (
    <form action={registerPasswordAccountAction} className="grid gap-5">
      <label className="font-semibold text-slate-800">
        아이디
        <input className={inputClass} name="username" required autoComplete="username" minLength={4} maxLength={20} placeholder="영문, 숫자, 밑줄 4~20자" />
      </label>
      <label className="font-semibold text-slate-800">
        비밀번호
        <input className={inputClass} name="password" required type="password" autoComplete="new-password" minLength={8} maxLength={128} />
      </label>
      <label className="font-semibold text-slate-800">
        비밀번호 확인
        <input className={inputClass} name="passwordConfirm" required type="password" autoComplete="new-password" minLength={8} maxLength={128} />
      </label>
      <label className="font-semibold text-slate-800">
        이메일
        <input className={inputClass} name="email" required type="email" autoComplete="email" placeholder="계정 확인과 비밀번호 찾기에 사용합니다" />
      </label>

      <fieldset className="grid gap-3 rounded-2xl bg-[#f7faf8] p-4 text-sm text-slate-700">
        <legend className="px-1 font-bold text-slate-900">필수 동의</legend>
        <label className="flex min-h-11 items-center gap-3"><input name="termsAccepted" required type="checkbox" /> 서비스 이용약관에 동의합니다.</label>
        <label className="flex min-h-11 items-center gap-3"><input name="privacyAccepted" required type="checkbox" /> 개인정보 수집·이용에 동의합니다.</label>
        <label className="flex min-h-11 items-center gap-3"><input name="ageOver14" required type="checkbox" /> 만 14세 이상입니다.</label>
      </fieldset>

      <button className="min-h-13 rounded-xl bg-[#0d5b45] px-5 py-3 text-lg font-extrabold text-white transition hover:bg-[#084b39]" type="submit">회원가입</button>
    </form>
  );
}
