import { describe, expect, it } from 'vitest';
import { estimateGrade, peopleFor, quote, recommendedTidyHours, validateInput, won, type QuoteInput } from '@/features/zipsin-clean/domain/pricing';

const base: QuoteInput = { service: 'move_in', areaPyeong: 24, rooms: 3, baths: 2, balcony: 'expanded', builtAge: 'mid', occupancy: 'just_left', pets: 'no', smoking: 'no' };

describe('가격 계산 — 고객은 사실만 고르고 가격은 하나로 확정', () => {
  it('TEST-PRICE-001 gives one fixed price for a clean 24-pyeong flat inside the public market range', () => {
    const result = quote(base);
    expect(result.grade).toBe(1);
    expect(result.priceWon).toBe(325_000);
    expect(result.priceWon).toBeGreaterThanOrEqual(290_000);
    expect(result.priceWon).toBeLessThanOrEqual(360_000);
    expect(result.people).toBe(2);
    expect(result.hours).toBe(7);
    expect(result.includes).not.toContain('베란다 물청소');
  });

  it('TEST-PRICE-002 raises the grade from facts anyone knows, and treats "모름" more carefully', () => {
    expect(estimateGrade({ builtAge: 'old', occupancy: 'just_left', pets: 'no', smoking: 'no' })).toBe(2);
    expect(estimateGrade({ builtAge: 'mid', occupancy: 'just_left', pets: 'no', smoking: 'yes' })).toBe(2);
    expect(estimateGrade({ builtAge: 'old', occupancy: 'vacant_long', pets: 'yes', smoking: 'no' })).toBe(3);
    expect(estimateGrade({ builtAge: 'unknown', occupancy: 'unknown', pets: 'unknown', smoking: 'unknown' })).toBe(2);
    const grade3 = quote({ ...base, builtAge: 'old', occupancy: 'vacant_long', smoking: 'yes' });
    expect(grade3.grade).toBe(3);
    expect(grade3.includes).toContain('곰팡이 제거·살균, 니코틴 세정');
    expect(grade3.priceWon).toBeGreaterThan(quote(base).priceWon);
  });

  it('TEST-PRICE-003 adds the full balcony (or unknown balcony) and new-build dust, and never goes below the minimum', () => {
    expect(quote({ ...base, balcony: 'full' }).priceWon).toBeGreaterThan(quote(base).priceWon);
    expect(quote({ ...base, balcony: 'unknown' }).priceWon).toBe(quote({ ...base, balcony: 'full' }).priceWon);
    expect(quote({ ...base, balcony: 'full' }).includes).toContain('베란다 물청소');
    expect(quote({ ...base, occupancy: 'new_build' }).priceWon).toBeGreaterThan(quote(base).priceWon);
    expect(quote({ ...base, areaPyeong: 6, rooms: 1, baths: 1 }).priceWon).toBe(180_000);
    expect(quote({ ...base, areaPyeong: 6 }).people).toBe(1);
  });

  it('TEST-PRICE-004 prices tidy cleaning by hours with a recommended length by size', () => {
    expect(recommendedTidyHours(10)).toBe(2);
    expect(recommendedTidyHours(20)).toBe(3);
    expect(recommendedTidyHours(30)).toBe(4);
    expect(quote({ ...base, service: 'tidy' })).toMatchObject({ priceWon: 55_000, hours: 3, people: 1 });
    expect(quote({ ...base, service: 'tidy', tidyHours: 4 }).priceWon).toBe(70_000);
  });

  it('TEST-PRICE-005 refuses impossible sizes and counts the unknown answers', () => {
    expect(validateInput({ ...base, areaPyeong: 3 })).toBe('평수는 5~80평 사이로 적어 주세요.');
    expect(validateInput({ ...base, rooms: 0 })).toBe('방 개수를 골라 주세요.');
    expect(validateInput({ ...base, baths: 9 })).toBe('욕실 개수를 골라 주세요.');
    expect(() => quote({ ...base, areaPyeong: Number.NaN })).toThrow('평수는');
    expect(quote({ ...base, balcony: 'unknown', pets: 'unknown' }).unknownCount).toBe(2);
    expect(peopleFor(30)).toBe(3);
    expect(peopleFor(45)).toBe(4);
    expect(won(325000)).toBe('325,000원');
  });
});
