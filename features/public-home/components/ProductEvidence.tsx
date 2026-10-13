import { CalendarDays, CheckCircle2, FileText, Image as ImageIcon, MessageCircle, Snowflake, Users } from 'lucide-react';
import type { PublicHomeScenario } from '../scenarios';
import styles from '@/components/PublicHome.module.css';

export function ProductEvidence({ scenario }: { scenario: PublicHomeScenario }) {
  return <div id={`scenario-panel-${scenario.id}`} role="tabpanel" aria-labelledby={`scenario-tab-${scenario.id}`} className={styles.evidence}>
    <header className={styles.evidenceHeader}><div><span>집 기록</span><strong>서울 노원구 · 1203호</strong></div><span className={styles.privateBadge}>초대된 사람만</span></header>
    {scenario.evidenceType === 'air-conditioner' && <EvidenceBody title="에어컨 설치·수리 기록" icon={<Snowflake size={19} />} rows={[["2026. 07. 14", "냉방이 약해 점검 요청", "대화 4개"], ["2025. 06. 03", "실외기 부품 교체", "사진 3장"], ["2023. 04. 18", "벽걸이 에어컨 설치", "문서 1개"]]} />}
    {scenario.evidenceType === 'reserve-fund' && <EvidenceBody title="장기수선충당금 관련 자료" icon={<FileText size={19} />} rows={[["계약", "주택 임대차계약서", "PDF"], ["2026. 09", "관리비 고지서", "사진"], ["2026. 09", "납부 확인 자료", "PDF"]]} />}
    {scenario.evidenceType === 'condition-compare' && <ConditionCompare />}
    {scenario.evidenceType === 'contract' && <Contract />}
    {scenario.evidenceType === 'office-continuity' && <EvidenceBody title="이 집의 다음 일" icon={<Users size={19} />} rows={[["완료", "광고용 사진 등록", "사진 12장"], ["답변 대기", "임대인 조건 확인", "대화 연결"], ["다음 행동", "계약서 특약 확인", "10월 16일"]]} />}
    {scenario.evidenceType === 'move-out' && <EvidenceBody title="입주부터 퇴거까지" icon={<CalendarDays size={19} />} rows={[["입주", "공간별 상태 사진", "24장"], ["거주 중", "변경사항과 대화", "기록 6개"], ["퇴거", "최종 상태 확인", "확인 중"]]} />}
  </div>;
}

function ConditionCompare() {
  return <section className={styles.evidenceBody}><h3><ImageIcon size={19} /> 거실 바닥 상태 비교</h3><div className={styles.compareGrid}>
    <article><span className={styles.photoPlaceholder}>입주 전 사진</span><strong>2025. 02. 18</strong><small>거실 · 창가 방향</small></article>
    <article><span className={`${styles.photoPlaceholder} ${styles.photoCurrent}`}>현재 사진</span><strong>2026. 10. 10</strong><small>같은 위치에서 촬영</small></article>
  </div></section>;
}

function Contract() {
  return <section className={styles.evidenceBody}><h3><FileText size={19} /> 임대차계약</h3><div className={styles.contractSummary}>
    <span>계약 만기일</span><strong>2027년 2월 28일</strong><span>남은 일정</span><b>갱신 여부 확인</b>
  </div><button type="button" className={styles.documentButton}><FileText size={17} /> 계약 문서 확인</button></section>;
}

function EvidenceBody({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: string[][] }) {
  return <section className={styles.evidenceBody}><h3>{icon} {title}</h3><ul className={styles.evidenceRows}>{rows.map(([meta, titleText, detail], index) => <li key={`${meta}-${titleText}`}>
    <span className={styles.rowIcon}>{index === rows.length - 1 ? <CheckCircle2 size={17} /> : <MessageCircle size={17} />}</span><span><small>{meta}</small><strong>{titleText}</strong></span><em>{detail}</em>
  </li>)}</ul></section>;
}
