import { CheckCircle2, FileText, Image as ImageIcon, MessageCircle, Snowflake, UserPlus } from 'lucide-react';
import type { PublicHomeScenario, PublicHomeStory } from '../scenarios';
import styles from '@/components/PublicHome.module.css';

type ProductEvidenceProps =
  | { story: PublicHomeStory; scenario?: never }
  | { story?: never; scenario: PublicHomeScenario };

export function ProductEvidence(props: ProductEvidenceProps) {
  if (props.story) return <StoryEvidence story={props.story} />;

  const { scenario } = props;
  return <div id={`scenario-panel-${scenario.id}`} role="tabpanel" aria-labelledby={`scenario-tab-${scenario.id}`} className={styles.evidence}>
    <header className={styles.evidenceHeader}><div><span>제품 화면 예시</span><strong>우리 집 기록</strong></div><span className={styles.privateBadge}>초대된 사람만</span></header>
    {scenario.evidenceType === 'scattered-records' && <EvidenceBody title="집 사진 기록" icon={<ImageIcon size={19} />} rows={[["입주 전", "거실·방 상태 사진", "사진 18장"], ["계약 중", "설비와 변경사항", "기록 5개"], ["최근", "같은 집에 이어서 저장", "바로 찾기"]]} />}
    {scenario.evidenceType === 'air-conditioner' && <EvidenceBody title="에어컨 설치·수리 기록" icon={<Snowflake size={19} />} rows={[["2026. 07. 14", "냉방이 약해 점검 요청", "대화 4개"], ["2025. 06. 03", "실외기 부품 교체", "사진 3장"], ["2023. 04. 18", "벽걸이 에어컨 설치", "문서 1개"]]} />}
    {scenario.evidenceType === 'condition-compare' && <ConditionCompare />}
    {scenario.evidenceType === 'contract' && <Contract />}
  </div>;
}

function StoryEvidence({ story }: { story: PublicHomeStory }) {
  return <aside className={styles.evidence} aria-label={`${story.shortTitle} 제품 화면 예시`}>
    <header className={styles.evidenceHeader}><div><span>집신 제품 화면</span><strong>집신아파트 201호</strong></div><span className={styles.privateBadge}>초대된 사람만</span></header>
    {story.evidenceType === 'gather' && <EvidenceSequence title="사진·문서·대화·일정" items={['사진', '문서', '대화', '일정']} />}
    {story.evidenceType === 'continuity' && <EvidenceSequence title="집의 기록 흐름" items={['입주 사진', '문서', '수리', '일정', '접근 종료', '새 관계']} />}
    {story.evidenceType === 'communication' && <CommunicationEvidence />}
    {story.evidenceType === 'home-history' && <EvidenceSequence title="사용자가 남긴 관리 기록" items={['입주', '확인', '교체', '수리', '현재']} />}
  </aside>;
}

function EvidenceSequence({ title, items }: { title: string; items: readonly string[] }) {
  return <section className={styles.evidenceBody}><h2><CheckCircle2 size={19} /> {title}</h2><ol className={styles.evidenceRows}>
    {items.map((item, index) => <li key={item}><span className={styles.rowIcon}><CheckCircle2 size={17} /></span><span><small>{String(index + 1).padStart(2, '0')}</small><strong>{item}</strong></span></li>)}
  </ol></section>;
}

function CommunicationEvidence() {
  return <section className={styles.evidenceBody}>
    <h2><UserPlus size={19} /> 직접 초대</h2>
    <ul className={styles.evidenceRows}>
      <li><span className={styles.rowIcon}><UserPlus size={17} /></span><span><small>이 집 사람들</small><strong>집별 연락처</strong></span></li>
      <li><span className={styles.rowIcon}><MessageCircle size={17} /></span><span><small>집 안에서 시작</small><strong>집신 채팅</strong></span></li>
      <li><span className={styles.rowIcon}><CheckCircle2 size={17} /></span><span><small>초대 이후</small><strong>새 기록</strong></span></li>
    </ul>
    <p>외부 통화·문자·메신저 이력은 가져오지 않습니다. 초대 후 집신에서 새 기록이 시작됩니다.</p>
  </section>;
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
