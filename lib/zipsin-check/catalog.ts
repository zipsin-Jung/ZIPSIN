import type {CheckDepth, CheckItem} from './types';

export const FIELD_ITEM_IDS = ['water-drain', 'moisture-leak', 'hot-water-heating'] as const;
export const CORE_ITEM_IDS = [...FIELD_ITEM_IDS];

export const LEGACY_ITEM_IDS_BY_FIELD: Record<string, string[]> = {
  'water-drain': ['water'],
  'moisture-leak': ['moisture', 'bathroom-detail', 'pests'],
  'hot-water-heating': ['climate'],
  'bathroom-drain-odor': [],
  'indoor-odor-vent': [],
  'light-noise': ['light-air', 'noise'],
  daylight: [],
  'options-damage': ['kitchen-detail', 'storage', 'outlets'],
  'safety-route': ['windows', 'security', 'entrance', 'cctv'],
};

type Seed = {
  id: string;
  group: string;
  title: string;
  prompt: string;
  why: string;
  nextAction: string;
  actions: string[];
  core?: boolean;
};

function makeItem(seed: Seed): CheckItem {
  return {
    ...seed,
    core: seed.core ?? false,
    priority: seed.core ? 'required' : 'recommended',
    how: seed.actions[0],
    question: `${seed.title}에 문제가 있거나 제한되는 조건이 있는지 물어보세요.`,
    actions: seed.actions.map((label, index) => ({id: `${seed.id}-${index + 1}`, label})),
  };
}

const PRIORITY_ITEMS: CheckItem[] = [
  makeItem({
    id: 'water-drain', group: '먼저 볼 3개', title: '물·배수', core: true,
    prompt: '부엌과 화장실의 물을 함께 사용해 수압과 물 빠짐을 직접 보세요.',
    why: '수압과 배수 문제는 매일 겪게 되고, 입주 뒤 원인과 수리 책임을 가리기 어려울 수 있어요.',
    nextAction: '물줄기가 갑자기 약해지거나 물이 고이고, 배관 아래가 젖어 있으면 사진과 메모를 남기세요.',
    actions: [
      '부엌 싱크대와 화장실 세면대 또는 샤워기 물을 함께 튼다',
      '물을 튼 상태에서 변기 물을 한 번 내리고 물줄기가 갑자기 약해지는지 본다',
      '세면대·싱크대·샤워실 바닥에 물이 고이지 않고 빠지는지 본다',
      '싱크대 아래 문을 열고 배관 연결 부위와 바닥에 물방울·젖은 자국이 있는지 본다',
    ],
  }),
  makeItem({
    id: 'moisture-leak', group: '먼저 볼 3개', title: '곰팡이·누수', core: true,
    prompt: '눈에 잘 안 띄는 위쪽 모서리와 창가, 수납장 안쪽을 가까이 보세요.',
    why: '새 도배와 가구로 흔적이 가려질 수 있어 눈으로 보고 냄새도 함께 확인해야 해요.',
    nextAction: '이상 흔적이나 퀴퀴한 냄새가 하나라도 있으면 위치를 찍고 원인을 물어보세요.',
    actions: [
      '천장과 벽이 만나는 위쪽 모서리에 검은 점·갈색 물자국·벽지 들뜸이 있는지 본다',
      '창문 끝·창틀·창문 아래 벽에 물자국·곰팡이·벽지 들뜸이 있는지 본다',
      '싱크대 아래 문을 열고 배관 주변 벽과 바닥에 젖은 자국·곰팡이가 있는지 본다',
      '장롱이나 큰 가구 뒤가 안 보이면 가까이 가서 퀴퀴한 냄새가 나는지 맡아본다',
    ],
  }),
  makeItem({
    id: 'hot-water-heating', group: '먼저 볼 3개', title: '온수·난방', core: true,
    prompt: '따뜻한 물이 나오는 시간과 보일러 작동 상태를 직접 확인하세요.',
    why: '온수와 난방은 입주 직후부터 꼭 필요하고, 고장 시 생활 불편과 비용이 커요.',
    nextAction: '온수가 늦게 나오거나 보일러에 오류 표시·큰 소리·누수 흔적이 있으면 수리 약속을 기록하세요.',
    actions: [
      '주방이나 화장실에서 온수를 틀고 따뜻해질 때까지 걸리는 시간을 본다',
      '보일러 조절기의 전원을 켜고 오류 숫자나 경고 표시가 없는지 본다',
      '가능하면 난방 또는 온수 작동 모습을 보여 달라고 요청한다',
      '보일러 본체와 연결 배관 아래에 물자국이 있거나 큰 소리가 나는지 본다',
    ],
  }),
];

const OTHER_FIELD_ITEMS: CheckItem[] = [
  makeItem({
    id: 'options-damage', group: '집 안에서 확인', title: '옵션 상태',
    prompt: '계약에 포함된 가전과 가구가 무엇인지 확인하고 겉으로 보이는 상태를 기록하세요.',
    why: '제공 옵션과 고장 책임이 불분명하면 입주 뒤 예상하지 못한 비용이 생길 수 있어요.',
    nextAction: '작동하지 않거나 심하게 낡은 옵션은 품목과 수리·교체 약속을 메모하세요.',
    actions: [
      '냉장고·세탁기·에어컨·옷장 등 계약에 포함되는 옵션을 하나씩 물어본다',
      '포함 옵션의 문·서랍을 열어 깨짐·심한 녹·곰팡이가 있는지 본다',
      '가능하면 에어컨·세탁기 등 전원 작동 여부를 보여 달라고 요청한다',
      '고장난 옵션을 입주 전 수리하거나 교체하는지 답변을 기록한다',
    ],
  }),
  makeItem({
    id: 'bathroom-drain-odor', group: '집 안에서 확인', title: '화장실 배수·냄새',
    prompt: '샤워실 바닥 배수구와 변기 주변에서 물 고임과 냄새를 확인하세요.',
    why: '배수구 냄새와 역류는 청소만으로 해결되지 않는 배관 문제일 수 있어요.',
    nextAction: '물이 고이거나 하수구 냄새가 계속 나면 배수구 위치를 찍고 수리 여부를 물어보세요.',
    actions: [
      '샤워기 물을 바닥에 흘려 배수구 쪽으로 바로 빠지는지 본다',
      '바닥 배수구와 세면대 아래에서 하수구 냄새가 나는지 가까이 확인한다',
      '변기 바닥 둘레에 물자국·변색·실리콘 벌어짐이 있는지 눈으로 본다',
    ],
  }),
  makeItem({
    id: 'indoor-odor-vent', group: '집 안에서 확인', title: '집 안 냄새·환기',
    prompt: '문을 닫은 상태의 냄새와 창문을 열었을 때 환기되는 정도를 느껴보세요.',
    why: '담배·곰팡이·하수구 냄새는 짧은 방문 때 방향제로 가려질 수 있어요.',
    nextAction: '특정 방이나 수납장 안에서만 냄새가 강하면 위치와 냄새 종류를 메모하세요.',
    actions: [
      '현관문을 닫고 20초 정도 서서 담배·곰팡이·하수구 냄새가 나는지 맡아본다',
      '붙박이장과 싱크대 문을 열고 안쪽에서 퀴퀴하거나 시큼한 냄새가 나는지 맡아본다',
      '창문 한 곳을 열어 공기가 통하는지, 맞은편에 열 수 있는 창이 있는지 본다',
    ],
  }),
  makeItem({
    id: 'light-noise', group: '집 안에서 확인', title: '소음',
    prompt: '말을 멈추고 창문을 닫은 때와 열었을 때 들리는 소리를 비교하세요.',
    why: '차량·상가·엘리베이터 소음은 사진으로 알 수 없고 생활 만족도에 크게 영향을 줘요.',
    nextAction: '창문을 닫아도 대화가 거슬릴 정도의 소리가 들리면 시간대와 소리 종류를 적어두세요.',
    actions: [
      '창문을 모두 닫고 20초 동안 말하지 않은 채 차량·사람·기계 소리를 듣는다',
      '창문을 열어 밖의 도로·상가·공사 소리가 얼마나 커지는지 비교한다',
      '현관 가까이에서 복도·계단·엘리베이터 소리가 크게 들리는지 확인한다',
    ],
  }),
  makeItem({
    id: 'daylight', group: '집 안에서 확인', title: '채광',
    prompt: '집의 불을 잠시 끄고 생활 공간까지 자연광이 들어오는지 보세요.',
    why: '낮에도 불을 계속 켜야 하는 집인지, 맞은편 건물에 빛이 막히는지 알 수 있어요.',
    nextAction: '방문 시간과 날씨에 따라 달라질 수 있으니 어두운 공간과 창밖 방향을 사진으로 남기세요.',
    actions: [
      '방과 거실의 불을 끄고 창가가 아닌 생활 공간까지 자연광이 들어오는지 본다',
      '창문 앞을 가까운 건물이나 높은 담이 막고 있는지 창밖을 본다',
      '햇빛이 거의 안 드는 방이나 주방이 어디인지 메모한다',
    ],
  }),
  makeItem({
    id: 'safety-route', group: '집 밖에서 확인', title: '안전·귀가 동선',
    prompt: '집 앞과 공동 출입구부터 큰길까지 실제로 걸으며 밝기와 사각지대를 보세요.',
    why: '낮의 집 내부만 봐서는 밤 귀가길과 공용 공간의 안전을 판단하기 어려워요.',
    nextAction: '어둡거나 사람 눈에 잘 띄지 않는 구간이 있으면 위치를 찍고 저녁에 한 번 더 보세요.',
    actions: [
      '현관에서 공동 출입구 또는 건물 밖까지 걸으며 어두운 복도·계단이 있는지 본다',
      '공동 출입구가 항상 열려 있는지, 비밀번호나 카드로 잠기는지 확인한다',
      '건물 입구에서 버스정류장·지하철역 방향 큰길까지 어두운 골목이 있는지 본다',
    ],
  }),
];

export const CHECK_ITEMS: CheckItem[] = [...PRIORITY_ITEMS, ...OTHER_FIELD_ITEMS];

export const ASK_ITEMS: CheckItem[] = [
  makeItem({id: 'fees', group: '물어볼 것', title: '관리비', prompt: '한 달 관리비와 포함 항목, 계절별 차이를 물어보세요.', why: '매달 내는 실제 주거비가 달라져요.', nextAction: '금액과 포함 항목을 나눠 기록하세요.', actions: ['최근 평균 관리비가 얼마인지 묻는다', '수도·인터넷·청소비 등 포함 항목과 별도 항목을 묻는다']}),
  makeItem({id: 'repair-promise', group: '물어볼 것', title: '입주 전 수리', prompt: '지금 보이는 문제를 누가 언제까지 고치는지 물어보세요.', why: '구두 약속은 나중에 확인하기 어려워요.', nextAction: '수리할 곳·완료일·담당자를 메모하고 특약 가능 여부를 확인하세요.', actions: ['고장나거나 곰팡이·누수가 있는 곳을 입주 전에 수리하는지 묻는다', '수리 항목과 완료 기한을 계약 특약에 적을 수 있는지 묻는다']}),
  makeItem({id: 'repair-responsibility', group: '물어볼 것', title: '수리 책임', prompt: '입주 후 보일러·옵션·배관 고장 시 누구에게 연락하고 누가 비용을 내는지 물어보세요.', why: '고장 뒤 연락처와 비용 책임을 두고 다툴 수 있어요.', nextAction: '연락할 사람과 비용 부담 기준을 기록하세요.', actions: ['입주 후 고장이 나면 임대인과 관리인 중 누구에게 먼저 연락하는지 묻는다', '보일러·배관·제공 옵션의 수리비 부담 기준을 묻는다']}),
  makeItem({id: 'utilities', group: '물어볼 것', title: '공과금', prompt: '전기·가스·수도 요금을 개별 납부하는지 물어보세요.', why: '관리비에 포함된 줄 알았던 비용이 별도로 나올 수 있어요.', nextAction: '개별 납부 항목과 계량기 분리 여부를 기록하세요.', actions: ['전기·가스·수도를 각각 직접 납부하는지 묻는다', '다른 세대와 계량기를 함께 쓰거나 정액으로 내는 항목이 있는지 묻는다']}),
  makeItem({id: 'move-in-date', group: '물어볼 것', title: '입주 날짜', prompt: '실제 입주 가능한 날짜와 기존 거주자 퇴거 일정을 확인하세요.', why: '이사 일정과 청소·수리 시간이 달라질 수 있어요.', nextAction: '입주 가능일과 열쇠를 받는 날짜를 기록하세요.', actions: ['기존 거주자가 나가는 날짜와 내가 입주할 수 있는 날짜를 묻는다', '청소와 약속한 수리가 입주 전에 끝나는지 묻는다']}),
  makeItem({id: 'parking-bicycle', group: '물어볼 것', title: '주차·자전거', prompt: '필요한 사람만 이용 가능 여부와 추가 비용을 물어보세요.', why: '공간이 보여도 세대별 사용 제한이나 비용이 있을 수 있어요.', nextAction: '가능 여부·월 비용·지정 위치를 기록하세요.', actions: ['자동차 주차가 가능한지와 월 추가 비용을 묻는다', '자전거를 둘 수 있는 지정 장소가 있는지 묻는다']}),
  makeItem({id: 'waste', group: '물어볼 것', title: '쓰레기', prompt: '일반·음식물·재활용 배출 장소와 시간을 물어보세요.', why: '배출 장소와 시간이 생활 동선에 영향을 줘요.', nextAction: '배출 장소와 요일·시간을 기록하세요.', actions: ['일반 쓰레기와 재활용품을 어디에 버리는지 묻는다', '음식물 쓰레기 배출 방법과 정해진 시간이 있는지 묻는다']}),
  makeItem({id: 'pets-smoking', group: '물어볼 것', title: '생활 제한', prompt: '반려동물·흡연·악기 등 내 생활과 관련된 제한을 물어보세요.', why: '건물 규칙이나 특약을 뒤늦게 알면 계약 유지가 어려울 수 있어요.', nextAction: '나에게 해당하는 제한과 계약 특약을 기록하세요.', actions: ['반려동물·흡연·악기 사용 중 나에게 해당하는 제한을 묻는다', '금지 또는 추가 비용 조건을 계약서에 어떻게 적는지 묻는다']}),
];

export const ALL_CHECK_ITEMS: CheckItem[] = [...CHECK_ITEMS, ...ASK_ITEMS];

export function getItemsForDepth(depth: CheckDepth) {
  return depth === 'quick' ? PRIORITY_ITEMS : CHECK_ITEMS;
}

export function getDetailItemsForField() {
  return [] as CheckItem[];
}
