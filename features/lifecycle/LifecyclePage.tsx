import Link from 'next/link';
import { ArrowRight, Check, ChevronRight, Image as ImageIcon, type LucideIcon } from 'lucide-react';

/**
 * 계약·입주 / 만기·퇴거 공통 화면 (대표 Figma "계약.입주", "만기.퇴거", 2026-10-19).
 * 단계 표시는 실제 기록(계약·체크리스트·입주/퇴거 상태)에서만 켜진다. 누를 수 없는 카드는 이유를 적는다.
 */
export type Step = { label: string; icon: LucideIcon; done: boolean };
export type ActionCard = { title: string; body: string; icon: LucideIcon; button: string; buttonIcon: LucideIcon; href: string | null };
export type StripPhoto = { id: string; url: string | null; date: string; title: string };

export function LifecyclePage({ title, lead, note, steps, sectionTitle, sectionLead, cards, homeSwitch, noHome, photosTitle, photosLead, photos, photosHref, addHref }: {
  title: string; lead: string; note: string; steps: Step[]; sectionTitle: string; sectionLead: string; cards: ActionCard[];
  homeSwitch?: React.ReactNode; noHome?: React.ReactNode; photosTitle: string; photosLead: string; photos: StripPhoto[]; photosHref: string | null; addHref: string | null;
}) {
  return (
    <main className="mx-auto max-w-[1120px] px-4 pt-4 md:px-10 md:pt-8">
      <div className="flex items-start gap-4">
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-[26px] font-bold tracking-[-0.02em] text-[#212124] md:text-[30px]">{title}</h1>
          <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">{lead}</p>
        </div>
        <p className="hidden rounded-lg bg-[#F2F3F6] px-4 py-3 text-sm leading-5 text-[#4D5159] md:block">{note}</p>
      </div>
      {homeSwitch}

      <ol aria-label="단계" className="mt-6 flex items-start justify-between gap-1">
        {steps.map((step, index) => (
          <li className="flex flex-1 items-start" key={step.label}>
            <div className="flex flex-1 flex-col items-center text-center">
              <span className={`relative grid size-14 place-items-center rounded-full border md:size-16 ${step.done ? 'border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border-[#DCDEE3] bg-white text-[#4D5159]'}`}>
                <step.icon aria-hidden="true" className="size-6 md:size-7" strokeWidth={1.5} />
                {step.done && <span aria-hidden="true" className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-[#0B6655] text-white"><Check className="size-3" strokeWidth={3} /></span>}
              </span>
              <span className="mt-2 text-sm font-semibold text-[#212124]">{step.label}<span className="sr-only">{step.done ? ' (완료)' : ' (아직)'}</span></span>
            </div>
            {index < steps.length - 1 && <ArrowRight aria-hidden="true" className="mt-5 hidden size-5 shrink-0 text-[#9EA3AB] md:block" />}
          </li>
        ))}
      </ol>

      <section aria-labelledby="lifecycle-cards" className="mt-6 rounded-2xl border border-[#E4E6EA] bg-white p-5 md:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[20px] font-bold text-[#212124]" id="lifecycle-cards">{sectionTitle}</h2>
            <p className="mt-1 text-[15px] text-[#4D5159]">{sectionLead}</p>
          </div>
          {addHref && <Link className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-[#212124] px-4 text-[15px] font-semibold text-[#212124]" href={addHref}>+ 기록 추가</Link>}
        </div>
        {noHome}
        <ul className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {cards.map((card) => (
            <li className="flex flex-col items-center rounded-xl border border-[#EAEBEE] px-3 py-5 text-center" key={card.title}>
              <h3 className="text-base font-bold text-[#212124]">{card.title}</h3>
              <span aria-hidden="true" className="mt-3 grid size-16 place-items-center rounded-full bg-[#F2F3F6] text-[#4D5159]"><card.icon className="size-8" strokeWidth={1.4} /></span>
              <p className="mt-3 flex-1 text-sm leading-6 text-[#4D5159]">{card.body}</p>
              {card.href
                ? <Link className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[#212124] text-[15px] font-semibold text-[#212124]" href={card.href}><card.buttonIcon aria-hidden="true" className="size-4" />{card.button}</Link>
                : <span aria-disabled="true" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg border border-[#DCDEE3] text-[15px] font-semibold text-[#9EA3AB]"><card.buttonIcon aria-hidden="true" className="size-4" />{card.button}</span>}
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-[17px] font-bold text-[#212124]"><ImageIcon aria-hidden="true" className="size-5" strokeWidth={1.6} />{photosTitle} <span className="text-sm font-normal text-[#6B7079]">{photosLead}</span></h3>
          {photosHref && <Link className="inline-flex min-h-11 items-center gap-0.5 text-sm font-semibold text-[#4D5159]" href={photosHref}>전체 보기<ChevronRight aria-hidden="true" className="size-4" /></Link>}
        </div>
        {photos.length ? (
          <ul className="-mx-1 mt-2 flex gap-3 overflow-x-auto px-1 pb-1">
            {photos.map((photo) => (
              <li className="w-[140px] shrink-0 md:w-auto md:flex-1" key={photo.id}>
                {photo.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img alt={photo.title} className="aspect-[4/3] w-full rounded-lg object-cover" src={photo.url} />
                  : <span className="grid aspect-[4/3] w-full place-items-center rounded-lg bg-[#F2F3F6] text-sm text-[#6B7079]">미리보기 없음</span>}
                <p className="mt-1.5 text-sm text-[#6B7079]">{photo.date}</p>
                <p className="truncate text-sm font-semibold text-[#212124]">{photo.title}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 rounded-xl bg-[#F7F7F8] px-4 py-6 text-center text-[15px] text-[#6B7079]">아직 올린 사진이 없어요.</p>}
      </section>
    </main>
  );
}

export function HomeSwitch({ homes, selectedId, basePath }: { homes: Array<{ id: string; label: string }>; selectedId: string | null; basePath: string }) {
  if (homes.length < 2) return null;
  return (
    <nav aria-label="집 고르기" className="-mx-4 mt-4 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-2">
        {homes.map((home) => (
          <li key={home.id}><Link aria-current={home.id === selectedId ? 'page' : undefined} className={`inline-flex min-h-11 items-center rounded-full px-4 text-[15px] ${home.id === selectedId ? 'bg-[#212124] font-semibold text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} href={`${basePath}?home=${home.id}`}>{home.label}</Link></li>
        ))}
      </ul>
    </nav>
  );
}
