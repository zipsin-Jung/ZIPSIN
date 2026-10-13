export type EvidenceType = 'scattered-records' | 'air-conditioner' | 'condition-compare' | 'contract';

export type PublicHomeScenario = {
  id: string;
  eyebrow: string;
  title: string;
  question: string;
  result: string;
  prevents: '반복' | '누락' | '단절' | '반복·누락' | '누락·단절';
  evidenceType: EvidenceType;
  imageSrc: string;
  imageAlt: string;
};

export const publicHomeScenarios: PublicHomeScenario[] = [
  { id: 'scattered-records', eyebrow: '흩어진 사진', title: '집 사진이 흩어졌을 때', question: '이 사진, 어느 집이었는지 바로 찾을 수 있나요?', result: '개인 사진첩과 컴퓨터 폴더 대신 집 한 채의 시간순 기록에서 찾습니다.', prevents: '반복·누락', evidenceType: 'scattered-records', imageSrc: '/images/public-home/scattered-records.png', imageAlt: '컴퓨터와 휴대전화에 흩어진 집 사진을 찾는 장면' },
  { id: 'contract', eyebrow: '언제 어디서나', title: '밖에서 급하게 계약서를 확인할 때', question: '계약서가 사무실 파일이나 집 서랍 안에만 있지는 않나요?', result: '권한이 있는 사람이 계약 문서와 계약 만기일을 바로 확인합니다.', prevents: '누락', evidenceType: 'contract', imageSrc: '/images/public-home/paper-contract.png', imageAlt: '외부에서 계약서를 찾는 순간과 집 안의 종이 서류함' },
  { id: 'air-conditioner', eyebrow: '설치·수리 이력', title: '이사 온 집의 에어컨이 고장 났을 때', question: '천장 안 설비, 언제 설치했고 전에 누가 확인했을까요?', result: '이 집에 남은 설치·수리 기록과 연락 내용을 시간순으로 확인합니다.', prevents: '반복', evidenceType: 'air-conditioner', imageSrc: '/images/public-home/ceiling-aircon.png', imageAlt: '천장형 에어컨의 이전 설치와 수리 기록을 찾는 장면' },
  { id: 'condition-compare', eyebrow: '입주 전후 비교', title: '도배·장판 상태가 원래 그랬는지 확인할 때', question: '입주 전 사진을 수천 장의 사진첩에서 다시 찾고 있나요?', result: '같은 공간의 입주 전 사진과 현재 사진을 촬영 시점과 함께 확인합니다.', prevents: '반복·누락', evidenceType: 'condition-compare', imageSrc: '/images/public-home/condition-before-after.png', imageAlt: '같은 집의 입주 전후 벽지와 바닥 상태를 비교한 장면' },
];
