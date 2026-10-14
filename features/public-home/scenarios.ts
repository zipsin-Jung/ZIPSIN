export type HomeStoryId = 'gather' | 'continuity' | 'communication' | 'home-history';

export type EvidenceType = HomeStoryId;

export type PublicHomeStory = {
  id: HomeStoryId;
  shortTitle: string;
  headline: string;
  description: string;
  conclusion?: string;
  evidenceType: EvidenceType;
  imageSrc: string;
  imageAlt: string;
};

export const publicHomeStories = [
  {
    id: 'gather',
    shortTitle: '모인다',
    headline: '집에 관한 모든 일, 이제 집신으로.',
    description: '사진·문서·대화·일정을 집 한 채에 이어서 기록하세요.',
    evidenceType: 'gather',
    imageSrc: '/images/public-home/story-01-gather.png',
    imageAlt: '흩어진 계약서와 사진, 통화와 일정이 집신의 한 집 기록으로 모이는 모습',
  },
  {
    id: 'continuity',
    shortTitle: '이어진다',
    headline: '사람은 바뀌어도, 집의 기록은 이어집니다.',
    description: '접근 권한은 끝나도 집에서 있었던 일을 다시 처음부터 시작하지 않도록.',
    evidenceType: 'continuity',
    imageSrc: '/images/public-home/story-02-continuity.png',
    imageAlt: '같은 집에서 계절과 사람이 바뀌어도 집의 관리 기록이 이어지는 모습',
  },
  {
    id: 'communication',
    shortTitle: '연결된다',
    headline: '어디서 나눈 말인지, 누구의 집인지 헤매지 않도록.',
    description: '사람을 초대하고 집별 연락처와 집신 채팅으로 새 대화를 시작하세요.',
    evidenceType: 'communication',
    imageSrc: '/images/public-home/story-03-communication.png',
    imageAlt: '뒤섞인 연락과 대화가 집신에서 집별 연락처와 전용 채팅으로 정리되는 모습',
  },
  {
    id: 'home-history',
    shortTitle: '가치가 된다',
    headline: '위치와 서류만 보고 계신가요?',
    description: '집도 시간이 지나면 노후됩니다. 에어컨·배관·난방·벽지·바닥까지, 지나온 관리 기록을 함께 확인하세요.',
    conclusion: '잘 관리한 시간은 집의 신뢰가 됩니다. 주거 이력이 가치가 되는 새로운 문화, 집신.',
    evidenceType: 'home-history',
    imageSrc: '/images/public-home/story-04-home-history.png',
    imageAlt: '집 안에서 위치와 계약 서류뿐 아니라 에어컨과 배관, 난방과 마감의 관리 이력을 함께 확인하는 모습',
  },
] as const satisfies readonly PublicHomeStory[];

export type LegacyEvidenceType = 'scattered-records' | 'air-conditioner' | 'condition-compare' | 'contract';

export type PublicHomeScenario = {
  id: string;
  eyebrow: string;
  title: string;
  question: string;
  result: string;
  prevents: '반복' | '누락' | '단절' | '반복·누락' | '누락·단절';
  evidenceType: LegacyEvidenceType;
  imageSrc: string;
  imageAlt: string;
};

export const publicHomeScenarios: PublicHomeScenario[] = [
  { id: 'scattered-records', eyebrow: '흩어진 사진', title: '집 사진이 흩어졌을 때', question: '이 사진, 어느 집이었는지 바로 찾을 수 있나요?', result: '개인 사진첩과 컴퓨터 폴더 대신 집 한 채의 시간순 기록에서 찾습니다.', prevents: '반복·누락', evidenceType: 'scattered-records', imageSrc: '/images/public-home/scattered-records.png', imageAlt: '컴퓨터와 휴대전화에 흩어진 집 사진을 찾는 장면' },
  { id: 'contract', eyebrow: '언제 어디서나', title: '밖에서 급하게 계약서를 확인할 때', question: '계약서가 사무실 파일이나 집 서랍 안에만 있지는 않나요?', result: '권한이 있는 사람이 계약 문서와 계약 만기일을 바로 확인합니다.', prevents: '누락', evidenceType: 'contract', imageSrc: '/images/public-home/paper-contract.png', imageAlt: '외부에서 계약서를 찾는 순간과 집 안의 종이 서류함' },
  { id: 'air-conditioner', eyebrow: '설치·수리 이력', title: '이사 온 집의 에어컨이 고장 났을 때', question: '천장 안 설비, 언제 설치했고 전에 누가 확인했을까요?', result: '이 집에 남은 설치·수리 기록과 연락 내용을 시간순으로 확인합니다.', prevents: '반복', evidenceType: 'air-conditioner', imageSrc: '/images/public-home/ceiling-aircon.png', imageAlt: '천장형 에어컨의 이전 설치와 수리 기록을 찾는 장면' },
  { id: 'condition-compare', eyebrow: '입주 전후 비교', title: '도배·장판 상태가 원래 그랬는지 확인할 때', question: '입주 전 사진을 수천 장의 사진첩에서 다시 찾고 있나요?', result: '같은 공간의 입주 전 사진과 현재 사진을 촬영 시점과 함께 확인합니다.', prevents: '반복·누락', evidenceType: 'condition-compare', imageSrc: '/images/public-home/condition-before-after.png', imageAlt: '같은 집의 입주 전후 벽지와 바닥 상태를 비교한 장면' },
];
