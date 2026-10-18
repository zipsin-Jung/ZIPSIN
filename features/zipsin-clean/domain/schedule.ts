/**
 * 예약 시간 규칙 (DEC-031): 이삿짐 도착 시간을 먼저 받고, 그 전에 끝나는 시작 시간만 고를 수 있게 한다.
 * 업체가 "이삿짐 들어올 시간"을 무기로 추가요금을 요구하지 못하게 하는 장치.
 */
export const START_HOURS = [8, 9, 10, 13] as const;
export type StartHour = (typeof START_HOURS)[number];
/** 이삿짐 도착 30분 전에는 끝나 있어야 한다. */
export const SAFETY_MINUTES = 30;

export function endHour(start: number, hours: number): number {
  return start + hours;
}

export function formatHour(value: number): string {
  const hour = Math.floor(value);
  const minute = Math.round((value - hour) * 60);
  const label = hour < 12 ? '오전' : '오후';
  const shown = hour % 12 === 0 ? 12 : hour % 12;
  return `${label} ${shown}시${minute ? ` ${minute}분` : ''}`;
}

export type ScheduleCheck = { ok: true; endsAt: number } | { ok: false; endsAt: number; latestStart: StartHour | null };

/** arrival이 null이면 이삿짐이 없거나 시간 제한이 없다. */
export function checkSchedule(start: number, hours: number, arrival: number | null): ScheduleCheck {
  const endsAt = endHour(start, hours);
  if (arrival === null) return { ok: true, endsAt };
  const limit = arrival - SAFETY_MINUTES / 60;
  if (endsAt <= limit) return { ok: true, endsAt };
  const fitting = START_HOURS.filter((candidate) => endHour(candidate, hours) <= limit);
  return { ok: false, endsAt, latestStart: fitting.length ? fitting[fitting.length - 1] : null };
}

export type DayOption = { iso: string; label: string; weekday: string };
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

/** 오늘 다음 날부터 14일. 날짜는 한국 시간 기준 달력 날짜로만 쓴다. */
export function nextDays(today: Date, count = 14): DayOption[] {
  const base = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(base.getTime() + (i + 1) * 86_400_000);
    return {
      iso: day.toISOString().slice(0, 10),
      label: `${day.getUTCMonth() + 1}월 ${day.getUTCDate()}일`,
      weekday: WEEKDAYS[day.getUTCDay()],
    };
  });
}
