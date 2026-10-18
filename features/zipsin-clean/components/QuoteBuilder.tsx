'use client';

import { useState, type ReactNode } from 'react';
import { quote, recommendedTidyHours, validateInput, won, type Balcony, type BuiltAge, type Occupancy, type Quote, type QuoteInput, type Service, type YesNo } from '@/features/zipsin-clean/domain/pricing';

/**
 * 고객용 "우리 집 청소 가격 바로 보기".
 * 고객은 누구나 아는 사실만 고른다(물때·기름때 판단 없음). 가격 하나가 나오고, 작업 시작 뒤에는 바뀌지 않는다.
 * 예약은 아직 만들지 않았으므로 '준비 중'으로 둔다(가짜로 처리된 척하지 않음).
 */
type Option<T extends string> = { value: T; label: string; hint?: string; art?: ReactNode };

const balconyArt = (kind: 'expanded' | 'normal' | 'full') => (
  <svg aria-hidden="true" className="h-12 w-20" viewBox="0 0 80 48" fill="none" stroke="currentColor" strokeWidth="2">
    <rect height="40" rx="2" width={kind === 'expanded' ? 72 : 56} x="4" y="4" />
    {kind !== 'expanded' && <rect height={kind === 'full' ? 40 : 18} rx="2" strokeDasharray="4 3" width="16" x="60" y="4" />}
    <line x1="30" x2="30" y1="4" y2="44" />
  </svg>
);

function Choice<T extends string>({ name, legend, options, value, onChange }: { name: string; legend: string; options: Option<T>[]; value: T; onChange: (value: T) => void }) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-base font-bold text-[#16211E]">{legend}</legend>
      <div aria-label={legend} className={`grid gap-2 ${options.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`} role="radiogroup">
        {options.map((option) => {
          const on = option.value === value;
          return (
            <label className={`flex min-h-14 cursor-pointer flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-center ${on ? 'border-2 border-[#0B6655] bg-[#E3F0EC] text-[#083E37]' : 'border border-[#C9D1CD] bg-white text-[#3E4B47]'}`} key={option.value}>
              <input checked={on} className="sr-only" name={name} onChange={() => onChange(option.value)} type="radio" value={option.value} />
              {option.art}
              <span className="text-[15px] font-semibold">{option.label}</span>
              {option.hint && <span className="text-sm">{option.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

const yesNo: Option<YesNo>[] = [{ value: 'no', label: '아니요' }, { value: 'yes', label: '예' }, { value: 'unknown', label: '모름' }];

export function QuoteBuilder() {
  const [input, setInput] = useState<QuoteInput>({ service: 'move_in', areaPyeong: 24, rooms: 3, baths: 2, balcony: 'expanded', builtAge: 'mid', occupancy: 'just_left', pets: 'no', smoking: 'no' });
  const [areaText, setAreaText] = useState('24');
  const [result, setResult] = useState<Quote | null>(null);
  const [error, setError] = useState('');

  const update = (patch: Partial<QuoteInput>) => { setInput((current) => ({ ...current, ...patch })); setResult(null); setError(''); };

  function show() {
    const problem = validateInput(input);
    if (problem) { setError(problem); setResult(null); return; }
    setResult(quote(input));
  }

  const tidy = input.service === 'tidy';
  const hours = input.tidyHours ?? recommendedTidyHours(input.areaPyeong || 0);

  return (
    <div className="grid gap-7">
      <Choice<Service> legend="어떤 청소가 필요하세요?" name="service" onChange={(service) => update({ service })} value={input.service}
        options={[{ value: 'move_in', label: '입주·이사 청소', hint: '빈집 전체, 여러 명' }, { value: 'tidy', label: '생활 정리 청소', hint: '사는 집, 시간제' }]} />

      <div className="grid gap-2">
        <label className="text-base font-bold text-[#16211E]" htmlFor="area">평수 (공급면적)</label>
        <div className="flex items-center gap-2">
          <input className="min-h-14 w-32 rounded-xl border border-[#C9D1CD] bg-white px-4 text-[17px] text-[#16211E]" id="area" inputMode="numeric" onChange={(event) => { setAreaText(event.target.value); update({ areaPyeong: Number(event.target.value) }); }} value={areaText} />
          <span className="text-base text-[#3E4B47]">평 · 계약서나 관리비 고지서에 있어요</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {(['rooms', 'baths'] as const).map((key) => (
          <div className="grid gap-2" key={key}>
            <label className="text-base font-bold text-[#16211E]" htmlFor={key}>{key === 'rooms' ? '방' : '욕실'}</label>
            <select className="min-h-14 rounded-xl border border-[#C9D1CD] bg-white px-3 text-[17px] text-[#16211E]" id={key} onChange={(event) => update({ [key]: Number(event.target.value) })} value={input[key]}>
              {Array.from({ length: key === 'rooms' ? 6 : 4 }, (_, i) => i + 1).map((count) => <option key={count} value={count}>{count}개</option>)}
            </select>
          </div>
        ))}
      </div>

      {tidy ? (
        <Choice<'2' | '3' | '4'> legend="몇 시간 할까요?" name="hours" onChange={(value) => update({ tidyHours: Number(value) as 2 | 3 | 4 })} value={String(hours) as '2' | '3' | '4'}
          options={[{ value: '2', label: '2시간' }, { value: '3', label: '3시간' }, { value: '4', label: '4시간' }]} />
      ) : (
        <>
          <Choice<Balcony> legend="베란다는 어떻게 생겼나요?" name="balcony" onChange={(balcony) => update({ balcony })} value={input.balcony}
            options={[
              { value: 'expanded', label: '확장형', hint: '베란다 없음', art: balconyArt('expanded') },
              { value: 'normal', label: '일반 베란다', hint: '방 하나 앞', art: balconyArt('normal') },
              { value: 'full', label: '통베란다', hint: '거실·방 앞 길게', art: balconyArt('full') },
              { value: 'unknown', label: '모름' },
            ]} />
          <Choice<BuiltAge> legend="지은 지 얼마나 됐나요?" name="built" onChange={(builtAge) => update({ builtAge })} value={input.builtAge}
            options={[{ value: 'new', label: '5년 이내' }, { value: 'mid', label: '6~19년' }, { value: 'old', label: '20년 이상' }, { value: 'unknown', label: '모름' }]} />
          <Choice<Occupancy> legend="청소 전 집 상태는요?" name="occupancy" onChange={(occupancy) => update({ occupancy })} value={input.occupancy}
            options={[{ value: 'just_left', label: '바로 전까지 살았음' }, { value: 'vacant_long', label: '3개월 넘게 비었음' }, { value: 'new_build', label: '신축 첫 입주' }, { value: 'unknown', label: '모름' }]} />
          <Choice<YesNo> legend="반려동물을 키운 집인가요?" name="pets" onChange={(pets) => update({ pets })} options={yesNo} value={input.pets} />
          <Choice<YesNo> legend="담배를 피운 집인가요?" name="smoking" onChange={(smoking) => update({ smoking })} options={yesNo} value={input.smoking} />
        </>
      )}

      {error && <p className="text-[15px] font-bold text-red-700" role="alert">{error}</p>}
      <button className="min-h-14 rounded-xl bg-[#0B6655] text-[17px] font-bold text-white" onClick={show} type="button">가격 보기</button>

      {result && (
        <section aria-label="확정 가격" className="grid gap-4 rounded-[20px] border-2 border-[#0B6655] bg-white p-5">
          <div>
            <p className="text-sm font-semibold text-[#0B6655]">예약하면 이 가격으로 확정</p>
            <p className="mt-1 text-[32px] font-bold tracking-[-0.02em] text-[#16211E]">{won(result.priceWon)}</p>
            <p className="text-base text-[#3E4B47]">{tidy ? `${result.people}명 · ${result.hours}시간` : `${result.people}명 · 약 ${result.hours}시간`}</p>
          </div>
          <div className="rounded-xl bg-[#E3F0EC] p-4 text-[#083E37]">
            <p className="text-base font-bold">작업을 시작한 뒤에는 가격이 바뀌지 않아요.</p>
            <p className="mt-1 text-[15px]">평수·방·욕실 수가 실제와 다를 때만 시작 전에 다시 계산해요. 곰팡이·스티커 같은 오염으로 추가요금을 받지 않아요.</p>
          </div>
          {result.unknownCount > 0 && <p className="text-[15px] text-[#3E4B47]">모른다고 고른 {result.unknownCount}가지는 조금 넉넉하게 계산했어요. 현장에서 더 받지 않아요.</p>}
          <div>
            <h2 className="!text-base font-bold !leading-6 text-[#16211E]">포함된 작업</h2>
            <ul className="mt-2 grid gap-1 text-[15px] text-[#3E4B47]">{result.includes.map((item) => <li className="flex gap-2" key={item}><span aria-hidden="true" className="text-[#0B6655]">✓</span>{item}</li>)}</ul>
          </div>
          <button className="min-h-14 rounded-xl bg-[#E1E6E3] text-[17px] font-bold text-[#3E4B47]" disabled type="button">예약하기 · 준비 중</button>
          <p className="text-sm text-[#3E4B47]">지금 가격은 공개 시세로 만든 임시 기준이에요. 인증 업체와 기준을 맞추는 중이라 바뀔 수 있어요.</p>
        </section>
      )}
    </div>
  );
}
