/**
 * 체크리스트 (대표 Figma "체크리스트", 2026-10-19).
 * '계약 전' 14개는 Figma 문구 그대로. 나머지 단계 항목은 Claude 초안 — 대표 확인 필요(WORK_STATUS에 표시).
 * 항목 설명(?)은 확인 방법만 짧게. 법률 판단이나 결과를 약속하지 않는다.
 */
export type StageId = 'before_contract' | 'contract_day' | 'before_move_in' | 'after_move_in' | 'living' | 'before_expiry' | 'move_out';
export type ChecklistItem = { key: string; label: string; help: string };
export type Stage = { id: StageId; label: string; title: string; lead: string; items: ChecklistItem[] };

export const STAGES: Stage[] = [
  {
    id: 'before_contract', label: '계약 전', title: '계약 전 체크리스트', lead: '만족스러운 계약을 위해 꼭 확인해야 할 항목들입니다.',
    items: [
      { key: 'registry', label: '등기부등본 확인', help: '소유자 이름과 근저당·압류가 있는지 봐요. 인터넷등기소에서 열람할 수 있어요.' },
      { key: 'building_ledger', label: '건축물대장 확인', help: '불법 건축물인지, 용도가 주택인지 봐요. 정부24에서 열람할 수 있어요.' },
      { key: 'special_terms', label: '특약사항 검토', help: '계약서에 넣을 약속(수리·원상복구 등)을 미리 적어 두세요.' },
      { key: 'fees', label: '관리비 및 공과금 확인', help: '관리비에 무엇이 포함되는지, 평균 금액이 얼마인지 물어보세요.' },
      { key: 'light', label: '채광 및 통풍 확인', help: '낮에 방문해 햇빛과 창문 방향을 봐요.' },
      { key: 'water', label: '수압 및 배수 상태 확인', help: '세면대·싱크대·샤워기를 같이 틀어 보세요.' },
      { key: 'mold', label: '곰팡이 발생 여부 확인', help: '창틀·벽 모서리·붙박이장 뒤를 봐요.' },
      { key: 'leak', label: '누수 및 방수 상태 확인', help: '천장 얼룩, 욕실 바닥 실리콘을 봐요.' },
      { key: 'bugs', label: '벌레 및 해충 여부 확인', help: '싱크대 아래, 배수구 주변을 봐요.' },
      { key: 'parking', label: '주차 및 편의시설 확인', help: '주차 가능 대수와 비용, 가까운 편의시설을 봐요.' },
      { key: 'noise', label: '소음 및 주변환경 확인', help: '저녁 시간에도 한 번 가 보면 좋아요.' },
      { key: 'internet', label: '인터넷 및 통신 상태 확인', help: '휴대폰 신호와 인터넷 설치 가능 여부를 봐요.' },
      { key: 'transport', label: '주변 시설 및 교통 확인', help: '역·정류장까지 실제로 걸어 보세요.' },
      { key: 'site_photos', label: '현장 사진 촬영 및 기록', help: '본 집의 사진과 메모를 남겨 두면 비교하기 쉬워요.' },
    ],
  },
  {
    id: 'contract_day', label: '계약 당일', title: '계약 당일 체크리스트', lead: '도장 찍기 전에 한 번 더 확인하세요.',
    items: [
      { key: 'registry_again', label: '등기부등본 다시 확인', help: '계약 당일 새로 뽑아 처음 본 것과 같은지 봐요.' },
      { key: 'owner_id', label: '임대인 신분증 확인', help: '등기부등본의 소유자와 같은 사람인지 봐요.' },
      { key: 'agent_check', label: '중개사무소 등록 확인', help: '국가공간정보포털에서 등록된 중개사무소인지 볼 수 있어요.' },
      { key: 'terms_written', label: '특약사항 계약서에 적기', help: '말로 한 약속은 계약서 특약에 적어요.' },
      { key: 'deposit_account', label: '보증금 입금 계좌 확인', help: '임대인 본인 명의 계좌인지 봐요.' },
      { key: 'contract_copy', label: '계약서 사본 받기', help: '서명한 계약서를 사진으로도 남겨 두세요.' },
    ],
  },
  {
    id: 'before_move_in', label: '입주 전', title: '입주 전 체크리스트', lead: '이사 들어가기 전에 챙길 것들이에요.',
    items: [
      { key: 'fixed_date', label: '확정일자 받기', help: '주민센터나 인터넷등기소에서 받을 수 있어요.' },
      { key: 'move_in_report', label: '전입신고 일정 잡기', help: '이사한 날 바로 할 수 있게 미리 준비해요.' },
      { key: 'balance', label: '잔금 날짜 확인', help: '잔금과 열쇠 받는 날을 같이 정해요.' },
      { key: 'utilities', label: '전기·가스·수도 명의 확인', help: '전 사람 요금이 정산됐는지 물어보세요.' },
      { key: 'insurance', label: '전세보증보험 가입 여부 검토', help: '가입 조건은 보증기관에서 확인하세요.' },
      { key: 'move_booking', label: '이사 업체 예약', help: '날짜와 엘리베이터 사용을 미리 확인해요.' },
    ],
  },
  {
    id: 'after_move_in', label: '입주 후', title: '입주 후 체크리스트', lead: '들어간 날 집 상태를 남겨 두세요.',
    items: [
      { key: 'move_in_report_done', label: '전입신고 하기', help: '이사한 날부터 14일 안에 해야 해요.' },
      { key: 'state_photos', label: '방마다 상태 사진 찍기', help: '집신 입주 상태 기록으로 방마다 남길 수 있어요.' },
      { key: 'meters', label: '계량기 숫자 기록', help: '전기·수도·가스 숫자를 사진으로 남겨요.' },
      { key: 'keys', label: '열쇠·카드 개수 확인', help: '받은 개수를 적어 두면 나갈 때 편해요.' },
      { key: 'defects', label: '고장·하자 알리기', help: '발견한 하자는 사진과 함께 바로 알려요.' },
      { key: 'door_code', label: '도어락 비밀번호 바꾸기', help: '번호는 기록에 남기지 마세요.' },
    ],
  },
  {
    id: 'living', label: '거주 중', title: '거주 중 체크리스트', lead: '사는 동안 기록해 두면 나중에 증거가 돼요.',
    items: [
      { key: 'repair_records', label: '수리 내역 기록', help: '수리 전·후 사진과 영수증을 함께 남겨요.' },
      { key: 'receipts', label: '영수증 보관', help: '관리비·수리비 영수증을 사진으로 남겨요.' },
      { key: 'boiler', label: '보일러·에어컨 점검', help: '계절이 바뀔 때 한 번씩 봐요.' },
      { key: 'mold_check', label: '곰팡이 생기지 않게 환기', help: '생기면 바로 사진을 찍어 알려요.' },
      { key: 'registry_mid', label: '등기부등본 가끔 확인', help: '집주인이 바뀌거나 대출이 생겼는지 봐요.' },
    ],
  },
  {
    id: 'before_expiry', label: '만기 전', title: '만기 전 체크리스트', lead: '계약 끝나기 전에 미리 정하세요.',
    items: [
      { key: 'decide', label: '연장할지 나갈지 정하기', help: '만기 몇 달 전까지 알려야 하는지 계약서를 봐요.' },
      { key: 'notify', label: '임대인에게 알리기', help: '문자 등 남는 방법으로 알리면 좋아요.' },
      { key: 'deposit_date', label: '보증금 돌려받을 날 정하기', help: '이사 날짜와 같은 날로 맞춰요.' },
      { key: 'next_home', label: '다음 집 계약 일정 맞추기', help: '잔금 날짜가 겹치지 않게 봐요.' },
    ],
  },
  {
    id: 'move_out', label: '퇴거', title: '퇴거 체크리스트', lead: '나갈 때 같은 자리를 다시 찍어 두세요.',
    items: [
      { key: 'out_photos', label: '방마다 퇴거 사진 찍기', help: '입주 때 찍은 자리와 같은 곳을 찍어요.' },
      { key: 'meters_out', label: '계량기 숫자 기록', help: '나가는 날 숫자를 사진으로 남겨요.' },
      { key: 'bills', label: '공과금 정산', help: '전기·가스·수도 요금을 정산해요.' },
      { key: 'keys_return', label: '열쇠·카드 돌려주기', help: '받은 개수만큼 돌려줬는지 확인해요.' },
      { key: 'deposit_back', label: '보증금 돌려받기 확인', help: '입금된 금액과 날짜를 기록해요.' },
      { key: 'move_out_report', label: '전출 확인', help: '새 집 전입신고를 하면 함께 처리돼요.' },
    ],
  },
];

export const STAGE_IDS = STAGES.map((stage) => stage.id);

export function stageProgress(stage: Stage, checked: Set<string>) {
  const done = stage.items.filter((item) => checked.has(`${stage.id}:${item.key}`)).length;
  return { done, total: stage.items.length, percent: stage.items.length ? Math.round((done / stage.items.length) * 100) : 0 };
}
