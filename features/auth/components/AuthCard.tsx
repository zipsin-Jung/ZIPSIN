import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, LockKeyhole } from 'lucide-react';

type Props = {
  titleId: string;
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** 카드 아래 잠금 안내 문구. 없으면 표시하지 않는다. */
  notice?: string;
  wide?: boolean;
  showLogo?: boolean;
  headerAside?: ReactNode;
};

/**
 * 2026-10-15 승인 로그인 시안과 같은 가운데 카드 틀(회원가입·계정 찾기·비밀번호 재설정에 재사용).
 * 390px 모바일에서는 카드 테두리 없이 흰 화면 전체를 쓴다.
 */
export function AuthCard({ titleId, title, subtitle, children, notice, wide = false, showLogo = true, headerAside }: Props) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-white px-5 pb-24 pt-5 text-[#212124] sm:justify-center sm:gap-5 sm:bg-[#F6F7F5] sm:px-4 sm:py-14">
      <section
        aria-labelledby={titleId}
        className={`flex w-full ${wide ? 'max-w-[520px]' : 'max-w-[460px]'} flex-col gap-7 sm:rounded-[20px] sm:border sm:border-[#EAEBEE] sm:bg-white sm:px-10 sm:pb-8 sm:pt-10 sm:shadow-[0_1px_2px_rgba(22,33,30,0.04),0_16px_40px_-24px_rgba(22,33,30,0.22)]`}
      >
        <div className="flex flex-col gap-6 sm:gap-5">
          {showLogo && (
            <div className="flex items-center justify-between">
              <Link aria-label="집신 처음 화면" className="inline-flex min-h-11 items-center gap-2.5 self-start" href="/">
                <img alt="" className="h-[30px] w-[36px] object-contain sm:h-[34px] sm:w-[40px]" src="/images/zipsin-company-logo.jpg" />
                <span className="flex flex-col leading-none">
                  <strong className="text-lg font-bold tracking-[-0.4px] sm:text-xl">집신</strong>
                  <span className="mt-1 text-[9px] font-bold tracking-[2px] text-[#6B7079]">ZIPSIN</span>
                </span>
              </Link>
              {headerAside}
            </div>
          )}
          <div className="flex flex-col gap-2">
            <h1 className="text-[26px] font-bold leading-[1.3] tracking-[-0.6px] sm:text-[28px]" id={titleId}>{title}</h1>
            {subtitle && <p className="text-base leading-relaxed text-[#6B7079]">{subtitle}</p>}
          </div>
        </div>
        {children}
        {notice && (
          <div className="flex items-start gap-2.5 rounded-xl bg-[#F6F7F5] p-4 sm:rounded-none sm:border-t sm:border-[#EAEBEE] sm:bg-transparent sm:px-0 sm:pb-0 sm:pt-5">
            <LockKeyhole aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-[#0B6655]" />
            <p className="text-sm leading-relaxed text-[#6B7079]">{notice}</p>
          </div>
        )}
      </section>
      <Link className="hidden min-h-11 items-center gap-1.5 text-sm text-[#4D5159] sm:inline-flex" href="/">
        <ArrowLeft aria-hidden="true" className="size-4" />
        집신 처음 화면으로
      </Link>
    </main>
  );
}

/** 입력칸 공통 모양(로그인 시안과 동일). */
export const authFieldClass = 'flex h-[52px] items-center rounded-xl border border-[#8A9792] bg-white focus-within:border-[#0B6655] focus-within:ring-[3px] focus-within:ring-[#0B6655]/15';
export const authInputClass = 'min-w-0 flex-1 bg-transparent text-base text-[#212124] outline-none placeholder:text-[#7A8681] focus-visible:outline-none!';
export const authPrimaryButtonClass = 'flex h-[52px] items-center justify-center gap-2.5 rounded-xl bg-[#0B6655] px-5 text-base font-semibold text-white! no-underline! transition hover:bg-[#083E37] disabled:cursor-not-allowed disabled:bg-[#A9C2BB]';
export const authSecondaryButtonClass = 'flex h-[52px] shrink-0 items-center justify-center whitespace-nowrap rounded-xl border border-[#0B6655] bg-white px-4 text-[15px] font-semibold text-[#0B6655]! no-underline! transition hover:bg-[#EAF2EF] disabled:cursor-not-allowed disabled:border-[#C9D2CE] disabled:text-[#8A9792]!';
export const authLabelClass = 'text-[15px] font-semibold text-[#212124]';
