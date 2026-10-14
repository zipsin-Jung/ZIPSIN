export type HomeStoryId = 'gather' | 'continuity' | 'communication' | 'home-history';

export type EvidenceType = HomeStoryId;

export type PublicHomeStory = {
  id: HomeStoryId;
  phase: '서론' | '본론' | '과정' | '결론';
  shortTitle: string;
  headline: string;
  headlineLines: readonly string[];
  description: string;
  conclusion?: string;
  evidenceType: EvidenceType;
  imageSrc: string;
  imageAlt: string;
};

export const publicHomeStories: readonly PublicHomeStory[] = [
  {
    id: 'home-history',
    phase: '서론',
    shortTitle: '살펴본다',
    headline: '부동산, 아직도 위치와 서류만 보고 계신가요?',
    headlineLines: ['부동산, 아직도', '위치와 서류만', '보고 계신가요?'],
    description: '집도 시간이 지나면 노후됩니다. 사진·문서·대화·일정을 집 한 채에 연결해 에어컨·배관·마감의 관리 이력까지 확인하세요.',
    conclusion: '주거 이력이 가치가 되는 새로운 문화, 집신.',
    evidenceType: 'home-history',
    imageSrc: '/images/public-home/story-04-home-history.png',
    imageAlt: '집 안에서 위치와 계약 서류뿐 아니라 에어컨과 배관, 난방과 마감의 관리 이력을 함께 확인하는 모습',
  },
  {
    id: 'communication',
    phase: '본론',
    shortTitle: '정리한다',
    headline: '어디서 나눈 말인지, 누구의 집인지 헤매지 않도록.',
    headlineLines: ['어디서 나눈 말인지,', '누구의 집인지', '헤매지 않도록.'],
    description: '외부 연락 기록을 가져오지 않습니다. 사람을 초대해 집별 연락처와 집신 채팅에서 새 기록을 시작하세요.',
    evidenceType: 'communication',
    imageSrc: '/images/public-home/story-03-communication.png',
    imageAlt: '뒤섞인 연락과 대화가 집신에서 집별 연락처와 전용 채팅으로 정리되는 모습',
  },
  {
    id: 'gather',
    phase: '과정',
    shortTitle: '모은다',
    headline: '부동산의 모든 정보를 집 한 채에 모아서.',
    headlineLines: ['부동산의 모든 정보를', '집 한 채에 모아서.'],
    description: '계약서·사진·대화·일정을 흩어 두지 않고, 하나의 집 기록으로 이어서 관리하세요.',
    evidenceType: 'gather',
    imageSrc: '/images/public-home/story-01-gather.png',
    imageAlt: '흩어진 계약서와 사진, 통화와 일정이 집신의 한 집 기록으로 모이는 모습',
  },
  {
    id: 'continuity',
    phase: '결론',
    shortTitle: '이어간다',
    headline: '사람이 바뀌어도, 집의 기록은 남도록.',
    headlineLines: ['사람이 바뀌어도,', '집의 기록은 남도록.'],
    description: '관계가 끝나면 접근 권한도 끝납니다. 집의 관리 기록만 이어지고, 이전 사람의 개인정보와 비공개 대화는 넘어가지 않습니다.',
    conclusion: '집에 관한 일의 반복·누락·단절을 막는 집신과 함께합니다.',
    evidenceType: 'continuity',
    imageSrc: '/images/public-home/story-02-continuity.png',
    imageAlt: '같은 집에서 계절과 사람이 바뀌어도 집의 관리 기록이 이어지는 모습',
  },
];

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
