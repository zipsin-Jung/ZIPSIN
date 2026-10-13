export type EvidenceType = 'air-conditioner' | 'reserve-fund' | 'condition-compare' | 'contract' | 'office-continuity' | 'move-out';

export type PublicHomeScenario = {
  id: string;
  eyebrow: string;
  title: string;
  question: string;
  result: string;
  prevents: '반복' | '누락' | '단절' | '반복·누락' | '누락·단절';
  evidenceType: EvidenceType;
};

export const publicHomeScenarios: PublicHomeScenario[] = [
  { id: 'air-conditioner', eyebrow: '설치·수리 이력', title: '이사 온 집의 에어컨이 고장 났을 때', question: '언제 설치했고, 전에 누가 수리했는지 다시 물어봐야 할까요?', result: '이 집에 남은 설치·수리 기록과 연락 내용을 시간순으로 확인합니다.', prevents: '반복', evidenceType: 'air-conditioner' },
  { id: 'reserve-fund', eyebrow: '문서 찾기', title: '장기수선충당금 자료가 필요할 때', question: '계약서와 고지서, 납부 자료가 각각 어디에 있는지 기억하시나요?', result: '집에 연결된 계약·고지·납부 자료를 필요한 순간 한곳에서 찾습니다.', prevents: '누락', evidenceType: 'reserve-fund' },
  { id: 'condition-compare', eyebrow: '입주 전후 비교', title: '도배·장판 상태가 원래 그랬는지 확인할 때', question: '입주 전 사진을 수천 장의 사진첩에서 다시 찾고 있나요?', result: '같은 공간의 입주 전 사진과 현재 사진을 촬영 시점과 함께 비교합니다.', prevents: '반복·누락', evidenceType: 'condition-compare' },
  { id: 'contract', eyebrow: '언제 어디서나', title: '밖에서 급하게 계약서를 확인할 때', question: '계약서가 사무실 파일이나 집 서랍 안에만 있지는 않나요?', result: '권한이 있는 사람이 계약 문서와 계약 만기일을 바로 확인합니다.', prevents: '누락', evidenceType: 'contract' },
  { id: 'office-continuity', eyebrow: '업무 인수인계', title: '직원이 바뀌어도 집 업무를 이어갈 때', question: '개인 휴대전화와 기억에 남은 업무는 사람이 나가면 어떻게 될까요?', result: '최근 기록과 다음 할 일이 사무소와 집에 남아 그대로 이어집니다.', prevents: '단절', evidenceType: 'office-continuity' },
  { id: 'move-out', eyebrow: '퇴거 확인', title: '퇴거할 때 처음 상태와 달라진 점을 볼 때', question: '입주 사진, 대화와 변경사항을 서로 다른 곳에서 찾고 있나요?', result: '입주부터 퇴거까지의 사진·대화·변경사항을 한 흐름에서 확인합니다.', prevents: '누락·단절', evidenceType: 'move-out' },
];
