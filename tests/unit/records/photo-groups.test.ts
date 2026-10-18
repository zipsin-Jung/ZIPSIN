import { describe, expect, it } from 'vitest';
import { chunk, distanceMeters, groupLabel, groupPhotos } from '@/features/records/domain/photo-groups';

const at = (day: number, hour: number, minute = 0) => ({ year: 2026, month: 10, day, hour, minute });

describe('사진을 찍은 날짜와 장소로 묶기 (승인 시안 ⑤-나)', () => {
  it('TEST-BULK-GROUP-001 groups by day and morning/afternoon, newest first, keeping photo order inside a group', () => {
    const groups = groupPhotos([
      { id: 'a', takenAt: at(12, 9), gps: null },
      { id: 'b', takenAt: at(15, 14), gps: null },
      { id: 'c', takenAt: at(12, 10), gps: null },
      { id: 'd', takenAt: at(15, 15), gps: null },
      { id: 'e', takenAt: at(15, 11), gps: null },
    ], 2026);
    expect(groups.map((group) => [group.label, group.ids])).toEqual([
      ['10월 15일 오후', ['b', 'd']],
      ['10월 15일 오전', ['e']],
      ['10월 12일 오전', ['a', 'c']],
    ]);
  });

  it('TEST-BULK-GROUP-002 splits the same half-day into places more than 300m apart; photos without location join the first place', () => {
    const home = { lat: 37.6, lng: 127.08 };
    const near = { lat: 37.6009, lng: 127.08 };
    const far = { lat: 37.62, lng: 127.08 };
    const groups = groupPhotos([
      { id: 'a', takenAt: at(15, 14), gps: home },
      { id: 'b', takenAt: at(15, 14, 10), gps: far },
      { id: 'c', takenAt: at(15, 14, 20), gps: near },
      { id: 'd', takenAt: at(15, 14, 30), gps: null },
    ], 2026);
    expect(groups.map((group) => [group.label, group.ids])).toEqual([
      ['10월 15일 오후', ['a', 'c', 'd']],
      ['10월 15일 오후 · 다른 장소', ['b']],
    ]);
  });

  it('TEST-BULK-GROUP-003 puts photos without any time in one group at the end and shows the year for other years', () => {
    const groups = groupPhotos([
      { id: 'a', takenAt: null, gps: null },
      { id: 'b', takenAt: { year: 2025, month: 3, day: 2, hour: 9, minute: 0 }, gps: null },
    ], 2026);
    expect(groups.map((group) => group.label)).toEqual(['2025년 3월 2일 오전', '날짜 모름']);
    expect(groupLabel({ year: 2026, month: 1, day: 1, hour: 12, minute: 0 }, 2026)).toBe('1월 1일 오후');
  });

  it('TEST-BULK-GROUP-004 measures distance and splits uploads into records of at most 10 photos', () => {
    expect(distanceMeters({ lat: 37.6, lng: 127 }, { lat: 37.6009, lng: 127 })).toBeGreaterThan(90);
    expect(distanceMeters({ lat: 37.6, lng: 127 }, { lat: 37.6009, lng: 127 })).toBeLessThan(110);
    expect(chunk([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], 10)).toEqual([[1, 2, 3, 4, 5, 6, 7, 8, 9, 10], [11, 12]]);
    expect(chunk([], 10)).toEqual([]);
  });
});
