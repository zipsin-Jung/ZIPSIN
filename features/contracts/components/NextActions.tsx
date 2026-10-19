import Link from 'next/link';
import type { NextAction } from '@/features/contracts/domain/lifecycle';

export function NextActions({ actions }: { actions: NextAction[] }) {
  const visible = actions.slice(0, 3);
  return (
    <section aria-labelledby="next-actions-title">
      <div className="flex items-end justify-between gap-4">
        <div><p className="text-sm font-bold text-[#0B6655]">지금 필요한 순서</p><h2 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#212124]" id="next-actions-title">지금 할 일</h2></div>
        <span className="text-sm text-[#6B7079]">최대 3개</span>
      </div>
      {visible.length ? <ol className="mt-4 grid gap-3 lg:grid-cols-3">{visible.map((action, index) => (
        <li key={action.id}>
          <Link className="app-panel flex min-h-40 h-full flex-col rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-[#9bc7c0]" href={action.href}>
            <span className="text-xs font-black text-[#0B6655]">{String(index + 1).padStart(2, '0')}</span>
            <strong className="mt-3 text-lg text-[#212124]">{action.title}</strong>
            <span className="mt-2 text-sm leading-6 text-[#6B7079]">{action.description}</span>
            <span className="mt-auto pt-4 text-sm font-bold text-[#0B6655]">확인하기 →</span>
          </Link>
        </li>
      ))}</ol> : <div className="mt-4 rounded-2xl border border-[#EAEBEE] bg-[#f7faf9] p-6"><p className="font-bold text-[#4D5159]">지금 바로 확인할 일이 없습니다</p><p className="mt-1 text-sm text-[#6B7079]">새 일정이나 기록이 생기면 이곳에 먼저 보여드릴게요.</p></div>}
    </section>
  );
}
