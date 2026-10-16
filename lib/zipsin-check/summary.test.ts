import {describe, expect, it} from 'vitest';
import {ASK_ITEMS, CHECK_ITEMS} from './catalog';
import {summarizeAnswers} from './summary';

const [c1, c2, c3] = CHECK_ITEMS;
const [q1, q2] = ASK_ITEMS;

describe('TEST-CK-SUM-001 집 카드 숫자', () => {
  it('확인한 집 체크·문제·질문 답변을 센다', () => {
    expect(summarizeAnswers({
      [c1.id]: {status: 'confirmed'},
      [c2.id]: {status: 'caution'},
      [c3.id]: {status: 'unverified'},
      [q1.id]: {status: 'unverified', memo: '월 8만원'},
      [q2.id]: {status: 'unverified', actionChecks: {a: false}},
    })).toEqual({checked: 2, checkTotal: CHECK_ITEMS.length, problems: 1, asked: 1, askTotal: ASK_ITEMS.length});
  });

  it('서버에 저장된 배열 형태도 같은 기준으로 센다', () => {
    expect(summarizeAnswers([{itemId: c1.id, status: 'caution'}, {itemId: q2.id, actionChecks: {a: true}}, {status: 'confirmed'}]))
      .toMatchObject({checked: 1, problems: 1, asked: 1});
  });
});
