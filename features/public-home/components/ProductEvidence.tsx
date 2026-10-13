import { CheckCircle2, FileText, Image as ImageIcon, MessageCircle, Snowflake } from 'lucide-react';
import type { PublicHomeScenario } from '../scenarios';
import styles from '@/components/PublicHome.module.css';

export function ProductEvidence({ scenario }: { scenario: PublicHomeScenario }) {
  return <div id={`scenario-panel-${scenario.id}`} role="tabpanel" aria-labelledby={`scenario-tab-${scenario.id}`} className={styles.evidence}>
    <header className={styles.evidenceHeader}><div><span>제품 화면 예시</span><strong>우리 집 기록</strong></div><span className={styles.privateBadge}>초대된 사람만</span></header>
    {scenario.evidenceType === 'scattered-records' && <EvidenceBody title="집 사진 기록" icon={<ImageIcon size={19} />} rows={[["입주 전", "거실·방 상태 사진", "사진 18장"], ["계약 중", "설비와 변경사항", "기록 5개"], ["최근", "같은 집에 이어서 저장", "바로 찾기"]]} />}
    {scenario.evidenceType === 'air-conditioner' && <EvidenceBody title="에어컨 설치·수리 기록" icon={<Snowflake size={19} />} rows={[["2026. 07. 14", "냉방이 약해 점검 요청", "대화 4개"], ["2025. 06. 03", "실외기 부품 교체", "사진 3장"], ["2023. 04. 18", "벽걸이 에어컨 설치", "문서 1개"]]} />}
    {scenario.evidenceType === 'condition-compare' && <ConditionCompare />}
    {scenario.evidenceType === 'contract' && <Contract />}
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
  </div><div className={styles.documentButton}><FileText size={17} /> 계약 문서 확인</div></section>;
}

function EvidenceBody({ title, icon, rows }: { title: string; icon: React.ReactNode; rows: string[][] }) {
  return <section className={styles.evidenceBody}><h3>{icon} {title}</h3><ul className={styles.evidenceRows}>{rows.map(([meta, titleText, detail], index) => <li key={`${meta}-${titleText}`}>
    <span className={styles.rowIcon}>{index === rows.length - 1 ? <CheckCircle2 size={17} /> : <MessageCircle size={17} />}</span><span><small>{meta}</small><strong>{titleText}</strong></span><em>{detail}</em>
  </li>)}</ul></section>;
}
