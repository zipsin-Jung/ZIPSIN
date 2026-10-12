import type {CheckDepth, CheckItem} from './types';

export const CHECK_ITEMS: CheckItem[] = [
  {
    id: 'moisture', group: '실내', core: true, title: '습기·곰팡이', prompt: '창가, 벽 모서리, 가구 뒤에 얼룩이나 냄새가 있나요?',
    why: '습기 흔적은 결로나 누수 가능성을 더 확인해야 한다는 신호일 수 있어요.',
    how: '창가와 외벽 모서리를 눈으로 보고, 퀴퀴한 냄새가 나는지 확인하세요.',
    question: '최근 결로나 누수 때문에 수리한 곳이 있나요?', nextAction: '사진이나 수리 내역을 요청하고 원인을 다시 확인하세요.',
  },
  {
    id: 'light-air', group: '실내', core: true, title: '채광·환기', prompt: '창문을 열 수 있고 자연광과 공기가 충분히 들어오나요?',
    why: '채광과 환기는 실제 생활의 쾌적함과 습기 관리에 영향을 줘요.',
    how: '불을 끄고 밝기를 보고, 창문을 직접 열어 맞통풍 여부를 확인하세요.',
    question: '평소 해가 가장 잘 드는 시간대는 언제인가요?', nextAction: '가능하면 다른 시간대에 다시 방문하세요.',
  },
  {
    id: 'noise', group: '생활', core: true, title: '소음', prompt: '창문을 닫고 열었을 때 외부·이웃 소음이 어떤가요?',
    why: '짧은 방문에서는 시간대별 교통·생활 소음을 놓치기 쉬워요.',
    how: '잠시 말하지 않고 창문을 닫은 상태와 연 상태를 비교하세요.',
    question: '밤이나 출퇴근 시간에 소음이 달라지나요?', nextAction: '평일 저녁 등 다른 시간대에 주변을 다시 확인하세요.',
  },
  {
    id: 'water', group: '욕실', core: true, title: '수압·배수', prompt: '수도와 샤워기 수압, 세면대·바닥 배수가 괜찮나요?',
    why: '약한 수압이나 느린 배수는 입주 후 반복 불편이나 수리로 이어질 수 있어요.',
    how: '수도와 샤워기를 함께 틀고 물이 빠지는 속도와 냄새를 확인하세요.',
    question: '배수 막힘이나 누수 수리 이력이 있나요?', nextAction: '이상하면 원인과 수리 책임을 계약 전에 확인하세요.',
  },
  {
    id: 'windows', group: '실내', core: true, title: '창호·문', prompt: '창문과 문이 잘 닫히고 틈이나 파손이 없나요?',
    why: '창호 틈은 외풍·소음·빗물 유입과 연결될 수 있어요.',
    how: '모든 창과 문을 한 번씩 열고 잠금장치와 틈을 보세요.',
    question: '창호나 방충망을 최근 교체한 적이 있나요?', nextAction: '파손 부위와 수리 약속을 기록으로 남기세요.',
  },
  {
    id: 'climate', group: '설비', core: true, title: '냉난방', prompt: '보일러와 냉방 설비의 종류·상태를 확인했나요?',
    why: '냉난방 방식과 노후도는 생활비와 고장 위험에 영향을 줘요.',
    how: '작동 여부, 제조 연도와 최근 점검 표시를 눈으로 확인하세요.',
    question: '최근 고장이나 교체 이력과 난방비는 어느 정도였나요?', nextAction: '작동을 못 봤다면 입주 전 점검 조건을 물어보세요.',
  },
  {
    id: 'security', group: '공용부', core: true, title: '보안·공용부', prompt: '현관 잠금, 조명, 출입구와 공용공간 상태가 괜찮나요?',
    why: '집 내부뿐 아니라 건물 출입 동선과 관리 상태도 생활 안전에 중요해요.',
    how: '출입구부터 집까지 직접 걸으며 조명, 잠금, 사각지대를 살펴보세요.',
    question: '공동현관과 CCTV는 누가 어떻게 관리하나요?', nextAction: '출입 비밀번호는 메모하지 말고 관리 주체만 확인하세요.',
  },
  {
    id: 'cost-route', group: '생활', core: true, title: '관리비·생활동선', prompt: '관리비 항목과 교통·편의시설 동선을 확인했나요?',
    why: '월세 외 반복 비용과 매일의 이동 시간은 실제 거주 만족도를 크게 바꿔요.',
    how: '관리비에 포함된 항목을 보고 주요 목적지까지 직접 이동해 보세요.',
    question: '관리비 평균과 별도 납부 항목은 무엇인가요?', nextAction: '최근 고지서와 별도 비용을 계약 전에 확인하세요.',
  },
  {
    id: 'official-check', group: '계약', core: true, title: '계약 전 공식 확인', prompt: '등기·건축물 정보와 계약 상대방 확인이 필요함을 알고 있나요?',
    why: '현장 관찰만으로 소유권, 권리관계나 적법성을 판단할 수 없어요.',
    how: '계약 직전 최신 공식 서류를 발급해 당사자와 전문가에게 확인하세요.',
    question: '최신 등기사항증명서와 건축물대장을 함께 확인할 수 있나요?', nextAction: '계약금 지급 전 공식 서류와 권리관계를 전문가와 확인하세요.', reviewedAt: '2026-10-13',
  },
  {
    id: 'outlets', group: '방', core: false, title: '콘센트·통신', prompt: '가구 배치에 필요한 콘센트와 통신 위치가 있나요?',
    why: '콘센트 위치는 가구 배치와 멀티탭 사용에 영향을 줘요.', how: '사용할 가구 위치를 떠올리며 개수와 위치를 보세요.', question: '작동하지 않는 콘센트가 있나요?', nextAction: '입주 전 작동 점검을 요청하세요.',
  },
  {
    id: 'bathroom-detail', group: '욕실', core: false, title: '욕실 환기·실리콘', prompt: '환풍기와 실리콘 마감에 이상이 없나요?',
    why: '환기 불량과 벌어진 마감은 습기 문제를 키울 수 있어요.', how: '환풍기를 켜고 소리와 흡입을 보고 모서리 마감을 살피세요.', question: '욕실 곰팡이나 방수 수리 이력이 있나요?', nextAction: '수리할 부분을 입주 전 상태 기록에 남기세요.',
  },
  {
    id: 'kitchen-detail', group: '주방', core: false, title: '주방 설비', prompt: '싱크대, 후드와 조리 공간이 사용하기 괜찮나요?',
    why: '싱크대 하부 누수와 환기 성능은 냄새와 위생에 영향을 줘요.', how: '싱크대 아래를 보고 후드를 직접 켜 보세요.', question: '가스·전기 조리 설비 점검은 언제 했나요?', nextAction: '설비 종류와 입주 전 점검 책임을 확인하세요.',
  },
  {
    id: 'storage', group: '방', core: false, title: '수납·가구 배치', prompt: '가지고 올 짐과 가구가 들어갈 공간이 충분한가요?',
    why: '사진으로 넓어 보여도 실제 가구가 들어가면 동선이 달라져요.', how: '큰 가구 치수를 기준으로 벽과 출입 동선을 확인하세요.', question: '제공되는 가구 중 이동하거나 빼도 되는 것은 무엇인가요?', nextAction: '큰 가구 치수를 재고 배치도를 간단히 그려보세요.',
  },
  {
    id: 'parking-waste', group: '공용부', core: false, title: '주차·분리배출', prompt: '주차와 쓰레기 배출 방식이 생활에 맞나요?',
    why: '이용 시간과 규칙을 모르고 계약하면 반복 갈등이 생길 수 있어요.', how: '주차 공간과 배출장소를 직접 보고 안내문을 확인하세요.', question: '추가 주차비와 배출 요일은 어떻게 되나요?', nextAction: '관리 주체에게 이용 규칙과 비용을 확인하세요.',
  },
  {
    id: 'pests', group: '실내', core: false, title: '해충 흔적', prompt: '창틀·싱크대 아래에 해충 흔적이 없나요?',
    why: '배설물이나 방제 흔적은 추가 관리가 필요할 수 있다는 신호예요.', how: '어두운 모서리와 배수 주변을 눈으로 확인하세요.', question: '최근 방역 시기와 반복 문제가 있었나요?', nextAction: '필요하면 입주 전 방역 조건을 협의하세요.',
  },
  {
    id: 'contract-conditions', group: '계약', core: false, title: '수리·원상복구 조건', prompt: '입주 전 수리와 퇴거 시 원상복구 조건을 확인했나요?',
    why: '구두 약속만 남으면 비용과 책임을 나중에 다투기 쉬워요.', how: '수리 대상·기한·책임자를 계약 특약에 적을 수 있는지 보세요.', question: '약속한 수리와 현재 하자를 계약서에 어떻게 남기나요?', nextAction: '계약 전 공인중개사나 전문가와 문구를 확인하세요.', reviewedAt: '2026-10-13',
  },
];

export const CORE_ITEM_IDS = CHECK_ITEMS.filter((item) => item.core).map((item) => item.id);

export function getItemsForDepth(depth: CheckDepth) {
  return depth === 'quick' ? CHECK_ITEMS.filter((item) => item.core) : CHECK_ITEMS;
}
