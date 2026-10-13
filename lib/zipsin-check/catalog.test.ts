import {describe,expect,it} from 'vitest';import {CHECK_ITEMS,FIELD_ITEM_IDS,getItemsForDepth} from './catalog';
describe('현장 필수 카탈로그',()=>{
  it('간단 체크는 꼭 확인할 5개만 쓴다',()=>{expect(getItemsForDepth('quick').map(i=>i.id)).toEqual([...FIELD_ITEM_IDS]);expect(getItemsForDepth('quick').every(i=>i.priority==='required')).toBe(true)});
  it('상세 체크는 공간별 24개 항목을 보여준다',()=>{expect(getItemsForDepth('thorough')).toHaveLength(24);expect(new Set(getItemsForDepth('thorough').map(i=>i.group)).size).toBeGreaterThanOrEqual(7)});
  it('각 항목에 1~3개 실행 체크가 있다',()=>{for(const item of CHECK_ITEMS)expect(item.actions?.length).toBeGreaterThanOrEqual(1)});
});
