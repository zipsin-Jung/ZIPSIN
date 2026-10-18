import { MOVE_IN, TIDY } from './price-table';

/**
 * 집신클린 가격 계산 (DEC: 고객은 판단하지 않는다).
 * 고객은 누구나 아는 "사실"만 고른다. 오염 정도는 사실로부터 등급(1~3)을 계산한다.
 * "모름"은 조금 더 조심스럽게(높게) 계산한다. 결과 가격은 예약할 때 확정되고 현장에서 바뀌지 않는다.
 */
export type Service = 'move_in' | 'tidy';
export type Balcony = 'expanded' | 'normal' | 'full' | 'unknown';
export type BuiltAge = 'new' | 'mid' | 'old' | 'unknown';
export type Occupancy = 'just_left' | 'vacant_long' | 'new_build' | 'unknown';
export type YesNo = 'yes' | 'no' | 'unknown';

export type QuoteInput = {
  service: Service;
  areaPyeong: number;
  rooms: number;
  baths: number;
  balcony: Balcony;
  builtAge: BuiltAge;
  occupancy: Occupancy;
  pets: YesNo;
  smoking: YesNo;
  tidyHours?: 2 | 3 | 4;
};

export type Grade = 1 | 2 | 3;
export type Quote = {
  priceWon: number;
  grade: Grade;
  people: number;
  hours: number;
  includes: string[];
  unknownCount: number;
};

export const AREA_MIN = 5;
export const AREA_MAX = 80;

export function validateInput(input: QuoteInput): string | null {
  if (!Number.isFinite(input.areaPyeong) || input.areaPyeong < AREA_MIN || input.areaPyeong > AREA_MAX) return `평수는 ${AREA_MIN}~${AREA_MAX}평 사이로 적어 주세요.`;
  if (!Number.isInteger(input.rooms) || input.rooms < 1 || input.rooms > 8) return '방 개수를 골라 주세요.';
  if (!Number.isInteger(input.baths) || input.baths < 1 || input.baths > 5) return '욕실 개수를 골라 주세요.';
  return null;
}

/** 사실에서 오염 등급을 계산한다. 점수가 높을수록 손이 많이 가는 집. */
export function estimateGrade(input: Pick<QuoteInput, 'builtAge' | 'occupancy' | 'pets' | 'smoking'>): Grade {
  let score = 0;
  if (input.builtAge === 'old') score += 1;
  if (input.builtAge === 'unknown') score += 0.5;
  if (input.occupancy === 'vacant_long') score += 1;
  if (input.occupancy === 'unknown') score += 0.5;
  if (input.pets === 'yes') score += 1;
  if (input.pets === 'unknown') score += 0.5;
  if (input.smoking === 'yes') score += 2;
  if (input.smoking === 'unknown') score += 0.5;
  if (score < 1) return 1;
  if (score < 2.5) return 2;
  return 3;
}

const roundTo = (value: number, step: number) => Math.round(value / step) * step;
const halfHour = (value: number) => Math.max(1, Math.ceil(value * 2) / 2);

export function peopleFor(areaPyeong: number): number {
  if (areaPyeong < 13) return 1;
  if (areaPyeong < 26) return 2;
  if (areaPyeong < 40) return 3;
  return 4;
}

export function recommendedTidyHours(areaPyeong: number): 2 | 3 | 4 {
  if (areaPyeong <= 15) return 2;
  if (areaPyeong <= 25) return 3;
  return 4;
}

export function quote(input: QuoteInput): Quote {
  const problem = validateInput(input);
  if (problem) throw new Error(problem);
  const unknownCount = [input.balcony, input.builtAge, input.occupancy, input.pets, input.smoking].filter((value) => value === 'unknown').length;

  if (input.service === 'tidy') {
    const hours = input.tidyHours ?? recommendedTidyHours(input.areaPyeong);
    return {
      priceWon: TIDY.wonByHours[hours],
      grade: 1,
      people: 1,
      hours,
      includes: ['방·거실 바닥과 먼지', '주방 싱크대·가스레인지 겉면', '욕실 세면대·변기·바닥', '정리정돈'],
      unknownCount,
    };
  }

  const grade = estimateGrade(input);
  const unit = MOVE_IN.unitWonPerPyeong + (input.occupancy === 'new_build' ? MOVE_IN.newBuildExtraPerPyeong : 0);
  const balconyFactor = input.balcony === 'full' || input.balcony === 'unknown' ? MOVE_IN.fullBalconyMultiplier : 1;
  const raw = input.areaPyeong * unit * MOVE_IN.gradeMultiplier[grade] * balconyFactor;
  const priceWon = Math.max(MOVE_IN.minimumWon, roundTo(raw, 5_000));
  const people = peopleFor(input.areaPyeong);
  const hours = halfHour((input.areaPyeong * MOVE_IN.hoursPerPyeong * MOVE_IN.gradeMultiplier[grade]) / people);
  const includes = ['방·거실 바닥·벽·창틀', '주방 싱크대·후드·수납장 안쪽', `욕실 ${input.baths}곳 줄눈·물때`, '현관·신발장'];
  if (input.balcony !== 'expanded') includes.push('베란다 물청소');
  if (grade >= 2) includes.push('기름때·물때 집중 제거, 스티커 제거');
  if (grade === 3) includes.push('곰팡이 제거·살균, 니코틴 세정');
  return { priceWon, grade, people, hours, includes, unknownCount };
}

export const won = (value: number) => `${value.toLocaleString('ko-KR')}원`;
