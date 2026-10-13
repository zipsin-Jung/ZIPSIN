import type {CheckDepth, CheckItem} from './types';

export const FIELD_ITEM_IDS = ['water-drain', 'moisture-leak', 'light-noise', 'windows-doors', 'options-damage'] as const;

export const LEGACY_ITEM_IDS_BY_FIELD: Record<(typeof FIELD_ITEM_IDS)[number], string[]> = {
  'water-drain': ['water'],
  'moisture-leak': ['moisture', 'bathroom-detail', 'pests'],
  'light-noise': ['light-air', 'noise'],
  'windows-doors': ['windows', 'security'],
  'options-damage': ['climate', 'cost-route', 'official-check', 'outlets', 'kitchen-detail', 'storage', 'parking-waste', 'contract-conditions'],
};

type Seed = [id:string, group:string, title:string, prompt:string, action:string, why:string];
const makeItem = ([id, group, title, prompt, action, why]: Seed, required = false): CheckItem => ({
  id, group, title, prompt, why, core: required, priority: required ? 'required' : 'recommended',
  how: action,
  question: `${title} 관련 수리나 제한이 있나요?`,
  nextAction: '이상이 있으면 메모와 사진으로 남기고 계약 전에 확인하세요.',
  actions: [{id: `${id}-check`, label: action}],
});

const REQUIRED_SEEDS: Seed[] = [
  ['water-drain','물','물·배수','수압과 물 빠짐이 괜찮은지 보세요.','화장실과 부엌을 동시에 틀고 변기 물을 내린다','약한 수압과 느린 배수는 반복 불편으로 이어질 수 있어요.'],
  ['moisture-leak','벽·천장','곰팡이·누수','얼룩과 퀴퀴한 냄새가 있는지 보세요.','창가·벽 모서리·장롱·싱크대 뒤를 본다','새 도배로 흔적이 가려질 수 있어요.'],
  ['light-noise','생활','채광·소음','불을 끄고 잠시 조용히 서 보세요.','창문을 열고 닫은 소음과 밝기를 비교한다','채광과 소음은 사진만으로 판단하기 어려워요.'],
  ['windows-doors','창호','창문·문','모든 창문과 문이 잘 열리고 닫히나요?','창문·문·잠금장치·방충망을 직접 확인한다','틈과 파손은 외풍·소음·빗물과 연결될 수 있어요.'],
  ['options-damage','상태','옵션·파손','제공 옵션과 파손 부위를 보세요.','가전·벽·바닥 상태를 보고 파손은 사진으로 남긴다','입주 전 상태가 수리·원상복구 범위의 기준이 돼요.'],
];

const DETAIL_SEEDS: Seed[] = [
  ['room-size','방·거실','실제 크기','가구를 놓을 공간이 충분한가요?','주요 가구의 크기를 대본다','사진보다 실제 동선이 좁을 수 있어요.'],
  ['outlets','방·거실','콘센트·통신','필요한 위치에 콘센트가 있나요?','콘센트와 인터넷 단자 위치를 본다','위치가 나쁘면 멀티탭과 배선이 늘어나요.'],
  ['floor-wall','방·거실','바닥·벽 들뜨','도배와 장판이 들떠 있지 않나요?','벽과 바닥 모서리를 본다','들뜰은 습기나 마감 불량의 흔적일 수 있어요.'],
  ['bath-vent','화장실','환풍기','환풍기가 작동하고 흡입력이 있나요?','환풍기를 켜고 소리와 흡입을 본다','환기가 안 되면 곰팡이가 생기기 쉬워요.'],
  ['bath-silicone','화장실','실리콘·타일','금이 가거나 벌어진 부분이 없나요?','바닥과 모서리 마감을 본다','벌어진 마감은 수분이 스며들 수 있어요.'],
  ['toilet','화장실','변기·세면대','흔들림과 누수가 없나요?','변기와 세면대를 살짝 흔들고 바닥을 본다','작은 누수도 악취와 수리로 이어질 수 있어요.'],
  ['sink-leak','주방','싱크대 하부','물자국이나 악취가 없나요?','싱크대 문을 열고 배관 주변을 본다','숨은 누수와 해충 흔적을 발견할 수 있어요.'],
  ['hood','주방','후드·환기','후드가 잘 작동하나요?','후드를 켜고 소리와 흡입을 확인한다','조리 냄새와 습기가 빠지지 않을 수 있어요.'],
  ['cooking','주방','조리 설비','가스나 인덕션 조건이 맞나요?','조리 설비 종류와 작동 여부를 묻는다','사용 방식에 따라 추가 구매비가 들 수 있어요.'],
  ['boiler','냉난방·전기','보일러','제조 연도와 작동 상태가 어떤가요?','보일러 표시를 보고 작동 여부를 묻는다','노후 설비는 난방비와 고장 가능성에 영향을 줘요.'],
  ['aircon','냉난방·전기','에어컨','제공 여부와 상태가 어떤가요?','에어컨과 배수호스 상태를 본다','청소와 고장 비용 책임을 알아야 해요.'],
  ['breaker','냉난방·전기','차단기·전기','차단기에 이상 흔적이 없나요?','차단기함의 표시와 변색을 눈으로 본다','전기 이상은 전문가 확인이 필요해요.'],
  ['entrance','건물·보안','공동현관','조명과 출입 잠금이 괜찮은가요?','밖에서 집까지 직접 걸어 본다','밤 귀가 동선과 보안에 영향을 줘요.'],
  ['cctv','건물·보안','CCTV·복도','공용부가 밝고 관리되나요?','CCTV 위치와 복도 조명을 본다','공용부 관리 상태는 생활 환경을 보여줘요.'],
  ['parking','건물·보안','주차·자전거','이용 공간과 추가 비용이 확실한가요?','주차장을 보고 이용 규칙을 묻는다','주차 제한은 매일의 불편으로 이어져요.'],
  ['waste','생활환경','쓰레기 배출','배출 장소와 시간이 편한가요?','배출 장소를 보고 요일을 묻는다','쓰레기 양과 냄새가 생활 동선에 영향을 줄 수 있어요.'],
  ['neighborhood','생활환경','귀가길','저녁에도 밝고 걸을 만한가요?','지하철역이나 버스정류장까지 걸어 본다','낮 방문만으로는 밤 환경을 알기 어려워요.'],
  ['fees','비용·계약','관리비 항목','포함과 별도 납부가 구분되나요?','최근 관리비와 포함 항목을 묻는다','반복 비용이 실제 예산을 바꿔요.'],
  ['repair-promise','비용·계약','입주 전 수리','수리 대상·기한·책임자가 확실한가요?','수리 약속을 특약에 남길 수 있는지 묻는다','구두 약속은 나중에 입증하기 어려워요.'],
];

const requiredItems = REQUIRED_SEEDS.map(seed => makeItem(seed, true));
requiredItems[0].actions = [{id:'simultaneous-water',label:'화장실과 부엌을 동시에 튼다'},{id:'flush-water',label:'물을 틀어 놓고 변기 물을 내린다'}];
requiredItems[1].actions = [{id:'corners',label:'창가와 벽 모서리를 본다'},{id:'behind-furniture',label:'장롱·싱크대 뒤를 확인한다'}];
const detailedItems = DETAIL_SEEDS.map(seed => makeItem(seed));
export const CHECK_ITEMS: CheckItem[] = [...requiredItems, ...detailedItems];
export const CORE_ITEM_IDS = [...FIELD_ITEM_IDS];
export function getItemsForDepth(depth: CheckDepth) { return depth === 'quick' ? requiredItems : CHECK_ITEMS; }

const DETAIL_IDS_BY_FIELD: Record<(typeof FIELD_ITEM_IDS)[number], string[]> = {
  'water-drain': ['toilet', 'sink-leak', 'bath-silicone'],
  'moisture-leak': ['floor-wall', 'bath-vent', 'hood'],
  'light-noise': ['room-size', 'neighborhood', 'waste', 'parking'],
  'windows-doors': ['entrance', 'cctv', 'outlets'],
  'options-damage': ['cooking', 'boiler', 'aircon', 'breaker', 'fees', 'repair-promise'],
};

export function getDetailItemsForField(fieldId: string) {
  const ids = DETAIL_IDS_BY_FIELD[fieldId as keyof typeof DETAIL_IDS_BY_FIELD] ?? [];
  return ids.map(id => detailedItems.find(item => item.id === id)).filter((item): item is CheckItem => Boolean(item));
}
