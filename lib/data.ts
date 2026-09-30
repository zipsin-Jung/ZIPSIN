export type Role = 'agent' | 'owner' | 'tenant' | 'repair';
export type Plan = 'FREE' | 'BASIC' | 'PRO' | 'BUSINESS';
export const roles: Record<Role, {label:string; title:string; description:string; home:string; badge:string; stats:[string,string][]; points:string[]}> = {
 agent:{label:'공인중개사',title:'담당자가 바뀌어도,\n사무소의 기록은 그대로.',description:'고객과 매물의 기록을 사무소에 남기세요. 개인 휴대폰에 흩어진 자료를 집별로 연결합니다.',home:'서울집신 공인중개사',badge:'연결된 집 128건',stats:[['새 요청','12'],['진행','7'],['오늘 일정','2']],points:['계약부터 수리까지 집별 이력','직원이 바뀌어도 이어지는 기록','오늘 처리할 요청과 일정 확인']},
 owner:{label:'임대인',title:'여러 집의 계약과 수리,\n한눈에 살펴보세요.',description:'집마다 다른 만기와 수리 일정. 기억에 의존하지 않고 필요한 기록을 바로 확인하세요.',home:'성수동 오피스텔 302호',badge:'임대인 · 임대중',stats:[['보유 집','3'],['진행 수리','2'],['이번 달 일정','1']],points:['여러 집의 계약·수리 현황','비용과 영수증을 한곳에','다가오는 만기와 일정 확인']},
 tenant:{label:'임차인',title:'요청한 순간부터 완료까지,\n우리 집의 변화를 함께.',description:'거주 중인 집의 수리 진행과 계약 만기를 확인하세요. 입주부터 퇴거까지 기록이 이어집니다.',home:'월계동 아파트 1203호',badge:'전세 · 만기 D-187',stats:[['수리 요청','1'],['예정 일정','1'],['보증 자료','3']],points:['수리 요청과 처리 상태 확인','입주·퇴거 사진 보관','계약 만기 D-DAY 확인']},
 repair:{label:'수리기사',title:'오늘 방문부터 작업 완료까지,\n빠짐없이 남기세요.',description:'의뢰 내용과 방문 일정을 확인하고, 작업 사진과 비용을 같은 집의 기록으로 정리하세요.',home:'오늘 방문 일정',badge:'수리기사 · 3건의 방문 예정',stats:[['새 의뢰','3'],['진행','5'],['오늘 방문','3']],points:['오늘 방문할 집과 의뢰 확인','수리 전후 사진 기록','비용·영수증 정리']}
};
export const plans: {id:Plan;price:string;who:string;features:string[]}[] = [
 {id:'FREE',price:'0',who:'거주 중인 집 1채',features:['내 집 1채 등록','기본 기록 관리','모바일 · PC 이용']},
 {id:'BASIC',price:'4,900',who:'임대인 2~9채',features:['집별 계약·수리 정리','사진과 영수증 보관','주요 일정 확인']},
 {id:'PRO',price:'9,900',who:'임대인 10채 이상',features:['여러 집의 현황 확인','집별 기록 통합 관리','만기와 수리 일정 관리']},
 {id:'BUSINESS',price:'99,000',who:'공인중개사 · 최대 50채',features:['사무소의 집 기록 관리','담당자가 바뀌어도 이력 유지','고객·기사 연락처 정리']}
];
