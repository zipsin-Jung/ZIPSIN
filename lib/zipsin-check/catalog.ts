import type {CheckDepth,CheckItem} from './types';
export const FIELD_ITEM_IDS=['water-drain','moisture-leak','light-noise','windows-doors','options-damage'] as const;
export const LEGACY_ITEM_IDS_BY_FIELD:Record<(typeof FIELD_ITEM_IDS)[number],string[]>={
'water-drain':['water'],'moisture-leak':['moisture','bathroom-detail','pests'],'light-noise':['light-air','noise'],'windows-doors':['windows','security'],'options-damage':['climate','cost-route','official-check','outlets','kitchen-detail','storage','parking-waste','contract-conditions']};
export const CHECK_ITEMS:CheckItem[]=[
{id:'water-drain',group:'물',core:true,title:'물·배수',prompt:'수압과 물 빠짐이 괜찮은지 보세요.',why:'약한 수압과 느린 배수는 입주 후 반복 불편으로 이어질 수 있어요.',how:'화장실과 부엌 물을 같이 틀고 배수를 보세요.',question:'배수 막힘이나 누수 수리 이력이 있나요?',nextAction:'이상이 있으면 수리 책임을 확인하세요.',actions:[{id:'simultaneous-water',label:'화장실과 부엌을 동시에 튼다'},{id:'flush-water',label:'물을 틀어 놓고 변기 물을 내린다'}]},
{id:'moisture-leak',group:'벽·천장',core:true,title:'곰팡이·누수',prompt:'얼룩과 퀴퀴한 냄새가 있는지 보세요.',why:'새 도배로 흔적이 가려질 수 있어 모서리를 따로 봐야 해요.',how:'창가·외벽 모서리·장롱 뒤를 보세요.',question:'최근 누수나 결로 수리를 했나요?',nextAction:'의심 부위를 사진으로 남기세요.',actions:[{id:'corners',label:'창가와 벽 모서리를 본다'},{id:'behind-furniture',label:'장롱·싱크대 뒤를 확인한다'}]},
{id:'light-noise',group:'생활',core:true,title:'채광·소음',prompt:'불을 끄고 잠시 조용히 서 보세요.',why:'채광과 소음은 사진만으로 판단하기 어려워요.',how:'창문을 열고 닫은 소음을 비교하세요.',question:'밤이나 출퇴근 시간은 어떤가요?',nextAction:'가능하면 다른 시간대에 다시 보세요.',actions:[{id:'lights-off',label:'불을 끄고 밝기를 본다'},{id:'window-noise',label:'창문을 열고 닫아 소음을 비교한다'}]},
{id:'windows-doors',group:'창호',core:true,title:'창문·문',prompt:'모든 창문과 문이 잘 열리고 닫히는지 보세요.',why:'틈과 파손은 외풍·소음·빗물과 연결될 수 있어요.',how:'잠금장치와 방충망도 함께 보세요.',question:'창호나 방충망 수리 계획이 있나요?',nextAction:'파손 부위를 입주 전 수리 항목으로 남기세요.',actions:[{id:'open-close',label:'창문과 문을 직접 열고 닫는다'},{id:'locks-screens',label:'잠금장치와 방충망을 본다'}]},
{id:'options-damage',group:'상태',core:true,title:'옵션·파손',prompt:'있는 옵션과 파손 부위를 짧게 남기세요.',why:'입주 전 상태를 남겨야 수리·원상복구 범위를 확인하기 쉬워요.',how:'제공 가전과 벽·바닥 파손을 보세요.',question:'어떤 옵션이 제공되고 누가 수리하나요?',nextAction:'파손은 사진과 메모로 남기세요.',actions:[{id:'included-options',label:'제공 옵션을 확인한다'},{id:'damage-photo',label:'벽·바닥·가전 파손을 본다'}]},
];
export const CORE_ITEM_IDS=[...FIELD_ITEM_IDS];
export function getItemsForDepth(_depth:CheckDepth){return CHECK_ITEMS}
