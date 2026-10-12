import {describe, expect, it} from 'vitest';
import {CHECK_ITEMS, CORE_ITEM_IDS, getItemsForDepth} from './catalog';

describe('집신체크 카탈로그', () => {
  it('빠른 체크와 꼼꼼 체크가 같은 공통 핵심 항목을 사용한다', () => {
    const quickCore = getItemsForDepth('quick').filter((item) => item.core).map((item) => item.id);
    const thoroughCore = getItemsForDepth('thorough').filter((item) => item.core).map((item) => item.id);

    expect(quickCore).toEqual(CORE_ITEM_IDS);
    expect(thoroughCore).toEqual(CORE_ITEM_IDS);
    expect(CORE_ITEM_IDS).toHaveLength(9);
  });

  it('모든 항목에 이유·방법·질문·다음 행동이 있다', () => {
    for (const item of CHECK_ITEMS) {
      expect(item.why.trim()).not.toBe('');
      expect(item.how.trim()).not.toBe('');
      expect(item.question.trim()).not.toBe('');
      expect(item.nextAction.trim()).not.toBe('');
    }
  });

  it('빠른 체크에는 공통 핵심만, 꼼꼼 체크에는 추가 항목도 보인다', () => {
    expect(getItemsForDepth('quick').every((item) => item.core)).toBe(true);
    expect(getItemsForDepth('thorough').some((item) => !item.core)).toBe(true);
  });
});
