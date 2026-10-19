import { describe, expect, it } from 'vitest';
import { STAGES, stageProgress } from '@/features/checklist/domain';

describe('체크리스트 (Figma)', () => {
  it('TEST-CHECKLIST-001 7단계, 계약 전 14항목(Figma 문구), 항목 키는 DB 규칙(영문 소문자·숫자·_)', () => {
    expect(STAGES.map((stage) => stage.label)).toEqual(['계약 전', '계약 당일', '입주 전', '입주 후', '거주 중', '만기 전', '퇴거']);
    expect(STAGES[0].items).toHaveLength(14);
    for (const stage of STAGES) for (const item of stage.items) expect(item.key).toMatch(/^[a-z0-9_]{2,40}$/);
    for (const stage of STAGES) expect(new Set(stage.items.map((item) => item.key)).size).toBe(stage.items.length);
  });
  it('TEST-CHECKLIST-002 진행률은 그 단계 체크만 센다', () => {
    const checked = new Set(['before_contract:registry', 'before_contract:mold', 'contract_day:owner_id']);
    expect(stageProgress(STAGES[0], checked)).toEqual({ done: 2, total: 14, percent: 14 });
  });
});
