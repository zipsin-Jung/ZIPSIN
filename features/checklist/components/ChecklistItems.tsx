'use client';

import { HelpCircle } from 'lucide-react';
import { useState, useTransition } from 'react';
import { toggleChecklistAction } from '@/features/checklist/actions';
import type { Stage } from '@/features/checklist/domain';

/** 체크하면 바로 저장된다(실패하면 되돌리고 알려 준다). ? 를 누르면 확인 방법이 열린다. */
export function ChecklistItems({ stage, homeId, initialChecked }: { stage: Stage; homeId: string | null; initialChecked: string[] }) {
  const [checked, setChecked] = useState(() => new Set(initialChecked));
  const [open, setOpen] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [, startTransition] = useTransition();

  function toggle(key: string) {
    const next = !checked.has(key);
    setChecked((current) => { const copy = new Set(current); if (next) copy.add(key); else copy.delete(key); return copy; });
    setMessage('');
    startTransition(async () => {
      const result = await toggleChecklistAction({ stage: stage.id, itemKey: key, homeId, checked: next });
      if (!result.ok) {
        setChecked((current) => { const copy = new Set(current); if (next) copy.delete(key); else copy.add(key); return copy; });
        setMessage('저장하지 못했어요. 다시 눌러 주세요.');
      }
    });
  }

  const done = stage.items.filter((item) => checked.has(item.key)).length;
  return (
    <div>
      <p className="text-sm font-semibold text-[#0B6655]" aria-live="polite">{done} / {stage.items.length} 완료</p>
      <ul className="mt-2 grid md:grid-cols-2 md:gap-x-8">
        {stage.items.map((item) => (
          <li className="border-b border-[#EAEBEE]" key={item.key}>
            <div className="flex min-h-[52px] items-center gap-3">
              <label className="flex min-h-11 flex-1 cursor-pointer items-center gap-3 text-[15px] text-[#212124]">
                <input checked={checked.has(item.key)} className="size-5 shrink-0 accent-[#0B6655]" onChange={() => toggle(item.key)} type="checkbox" />
                <span className={checked.has(item.key) ? 'text-[#6B7079] line-through' : ''}>{item.label}</span>
              </label>
              <button aria-expanded={open === item.key} aria-label={`${item.label} 확인 방법`} className="grid size-11 shrink-0 place-items-center rounded-full text-[#9EA3AB] hover:text-[#4D5159]" onClick={() => setOpen(open === item.key ? null : item.key)} type="button">
                <HelpCircle aria-hidden="true" className="size-5" strokeWidth={1.6} />
              </button>
            </div>
            {open === item.key && <p className="pb-3 pl-8 text-sm leading-6 text-[#4D5159]">{item.help}</p>}
          </li>
        ))}
      </ul>
      {message && <p className="mt-2 text-sm font-semibold text-[#8C1D18]" role="alert">{message}</p>}
    </div>
  );
}
