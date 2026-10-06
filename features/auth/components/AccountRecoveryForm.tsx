import { requestAccountRecoveryAction } from '@/features/auth/actions/request-account-recovery';

export function AccountRecoveryForm() {
  return (
    <form action={requestAccountRecoveryAction} className="grid gap-5">
      <label className="font-bold text-slate-800">
        가입 이메일
        <input className="mt-2 min-h-13 w-full rounded-xl border border-slate-300 px-4 text-base outline-none focus:border-emerald-700" name="email" type="email" autoComplete="email" required />
      </label>
      <button className="min-h-13 rounded-xl bg-[#0b543f] px-5 font-extrabold text-white" type="submit">확인 메일 받기</button>
    </form>
  );
}
