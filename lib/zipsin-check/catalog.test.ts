import {describe,expect,it} from 'vitest';
import {ASK_ITEMS,CHECK_ITEMS,FIELD_ITEM_IDS,getItemsForDepth} from './catalog';

describe('초보 임차인 현장 카탈로그',()=>{
  it('가장 먼저 볼 세 항목을 물·곰팡이·난방 순서로 둔다',()=>{
    expect(FIELD_ITEM_IDS).toEqual(['water-drain','moisture-leak','hot-water-heating']);
    expect(getItemsForDepth('quick').map(item=>item.id)).toEqual([...FIELD_ITEM_IDS]);
  });

  it('모든 현장 항목은 위치와 행동을 알 수 있는 상세 체크를 제공한다',()=>{
    expect(CHECK_ITEMS.length).toBeGreaterThanOrEqual(9);
    for(const item of CHECK_ITEMS){
      expect(item.actions?.length).toBeGreaterThanOrEqual(2);
      expect(item.prompt.length).toBeGreaterThan(10);
    }
    expect(CHECK_ITEMS.find(item=>item.id==='moisture-leak')?.actions?.map(action=>action.label).join(' ')).toContain('창문 끝');
    expect(CHECK_ITEMS.find(item=>item.id==='water-drain')?.actions?.map(action=>action.label).join(' ')).toContain('싱크대 아래 문');
  });

  it('물어볼 것은 비용과 수리 약속을 먼저 묻는 순서로 제공한다',()=>{
    expect(ASK_ITEMS.map(item=>item.id)).toEqual([
      'fees','repair-promise','repair-responsibility','utilities','move-in-date','parking-bicycle','waste','pets-smoking',
    ]);
    expect(ASK_ITEMS.every(item=>item.group==='물어볼 것')).toBe(true);
  });
});
