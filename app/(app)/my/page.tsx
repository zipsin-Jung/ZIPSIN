import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { logoutAction } from '@/features/auth/actions/logout';
import { loadSpaceContext } from '@/features/workspace/services/spaces';

const roleLabels: Record<string, string> = {
  principal_broker: '대표 개업공인중개사',
  associate_broker: '소속공인중개사',
  assistant: '중개보조원',
  landlord: '임대인',
  tenant: '임차인',
};

type Props = { searchParams: Promise<{ error?: string }> };

/** 마이 (v2 시안 V2My, DEC-040): 내 아이디 하나와 그 안의 계정(개인·사무소)을 보여 준다. */
export default async function MyPage({ searchParams }: Props) {
  const params = await searchParams;
  const { supabase, user } = await requireOnboardingComplete();
  const [{ data: profile }, { data: role }, { data: account }, context] = await Promise.all([
    supabase.from('profiles').select('display_name, phone_verified_at').eq('user_id', user.id).maybeSingle(),
    supabase.from('user_roles').select('primary_role').eq('user_id', user.id).maybeSingle(),
    supabase.from('account_usernames').select('username').eq('user_id', user.id).maybeSingle(),
    loadSpaceContext(supabase, user.id),
  ]);
  const displayName = profile?.display_name?.trim() || '사용자';
  const roleLabel = role?.primary_role ? roleLabels[role.primary_role] ?? '집신 사용자' : '집신 사용자';
  const idLine = [account?.username ? `아이디 ${account.username}` : null, profile?.phone_verified_at ? '휴대폰 확인됨' : null].filter(Boolean).join(' · ');
  const menu = [
    { href: '/homes', label: `내 집 ${context.personalHomes.length}채` },
    { href: '/tasks', label: '할 일' },
    { href: '/partners/new', label: '집신 파트너 등록' },
    { href: '/support', label: '고객지원 채팅' },
  ];

  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-4 md:py-10">
      <h1 className="text-[22px] font-bold tracking-[-0.02em] text-[#212124]">마이</h1>
      {params.error === 'logout_failed' && <p className="mt-4 rounded-xl bg-red-50 p-4 font-semibold text-red-800" role="alert">로그아웃하지 못했습니다. 잠시 후 다시 시도해 주세요.</p>}

      <section aria-labelledby="my-name" className="mt-5 flex items-center gap-3">
        <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-full bg-[#E3F0EC] text-[22px] font-bold text-[#083E37]">{displayName.slice(0, 1)}</span>
        <span className="min-w-0">
          <h2 className="truncate text-[20px] font-bold text-[#212124]" id="my-name">{displayName}님의 집신</h2>
          {idLine && <span className="block text-[15px] text-[#6B7079]">{idLine}</span>}
        </span>
      </section>

      <section aria-labelledby="my-accounts" className="mt-5 rounded-2xl bg-[#F2F3F6] p-4">
        <h2 className="text-[15px] font-bold text-[#212124]" id="my-accounts">쓰는 곳 <span className="font-normal text-[#6B7079]">(위 이름 ▾에서 바꿔요)</span></h2>
        <ul className="mt-2 grid gap-1 text-[15px] text-[#4D5159]">
          <li>· {displayName} — 내 집 · <span>{roleLabel}</span></li>
          {context.offices.map((office) => <li key={office.id}>· {office.name} — 사무소</li>)}
        </ul>
      </section>

      <nav aria-label="업무와 도움" className="mt-4">
        <ul className="grid">
          {menu.map((item) => (
            <li className="border-b border-[#EAEBEE]" key={item.href}>
              <Link className="flex min-h-14 items-center justify-between text-base font-semibold text-[#212124]" href={item.href}>{item.label}<ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" /></Link>
            </li>
          ))}
        </ul>
      </nav>

      <form action={logoutAction} className="mt-6">
        <button className="min-h-12 rounded-xl px-1 text-base font-semibold text-[#6B7079] underline underline-offset-4" type="submit">로그아웃</button>
        <p className="mt-1 text-sm leading-5 text-[#6B7079]">공용 PC에서는 작업을 마친 뒤 반드시 로그아웃해 주세요.</p>
      </form>
    </main>
  );
}
