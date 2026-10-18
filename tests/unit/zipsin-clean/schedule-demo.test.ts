import { describe, expect, it } from 'vitest';
import { checkSchedule, formatHour, nextDays } from '@/features/zipsin-clean/domain/schedule';
import { availablePartners, isCleanDemoOpen } from '@/features/zipsin-clean/domain/demo';

describe('예약 시간 — 이삿짐 도착 전에 끝나는 시간만', () => {
  it('TEST-CL-TIME-001 allows a start that ends 30 minutes before the moving truck', () => {
    expect(checkSchedule(9, 7, 17)).toEqual({ ok: true, endsAt: 16 });
    expect(checkSchedule(9, 7, null)).toEqual({ ok: true, endsAt: 16 });
  });

  it('TEST-CL-TIME-002 blocks a start that would end too late and suggests the latest start that fits', () => {
    expect(checkSchedule(10, 7, 17)).toEqual({ ok: false, endsAt: 17, latestStart: 9 });
    expect(checkSchedule(13, 3, 15)).toEqual({ ok: false, endsAt: 16, latestStart: 10 });
  });

  it('TEST-CL-TIME-003 says no start fits when the day is too short', () => {
    expect(checkSchedule(8, 7, 14)).toEqual({ ok: false, endsAt: 15, latestStart: null });
  });

  it('TEST-CL-TIME-004 formats hours in Korean and lists the next 14 days', () => {
    expect(formatHour(9)).toBe('오전 9시');
    expect(formatHour(16.5)).toBe('오후 4시 30분');
    expect(formatHour(12)).toBe('오후 12시');
    const days = nextDays(new Date(2026, 9, 18));
    expect(days).toHaveLength(14);
    expect(days[0]).toEqual({ iso: '2026-10-19', label: '10월 19일', weekday: '월' });
  });
});

describe('체험용 설정', () => {
  it('TEST-CL-DEMO-001 never opens the demo on the live site', () => {
    expect(isCleanDemoOpen('production')).toBe(false);
    expect(isCleanDemoOpen('preview')).toBe(true);
    expect(isCleanDemoOpen(undefined)).toBe(true);
  });

  it('TEST-CL-DEMO-002 keeps at least one example partner open every day', () => {
    for (let day = 0; day < 14; day += 1) expect(availablePartners(day).length).toBeGreaterThan(0);
    expect(availablePartners(0).length).toBe(2);
  });
});
