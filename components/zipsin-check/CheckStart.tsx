'use client';
import {useRef,type ReactNode} from 'react';
import {Lightbulb,MapPin,Plus,Star,Trash2} from 'lucide-react';
import {ASK_ITEMS,CHECK_ITEMS} from '@/lib/zipsin-check/catalog';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

const INSIDE=CHECK_ITEMS;
const REQUIRED_COUNT=CHECK_ITEMS.filter(item=>item.priority==='required').length;

export default function CheckStart({candidates,onNew,onInstant,onResume,onViewAll,onCompare,onDelete,headerActions}:{candidates:CandidateV2[];headerActions?:ReactNode;onNew:()=>void;onInstant:()=>void;onResume:(id:string)=>void;onViewAll:()=>void;onCompare:()=>void;onDelete:(id:string)=>void}){
  const askHeadingRef=useRef<HTMLHeadingElement>(null);
  // 홈의 '체크 전 물어볼 것' 목록으로 바로 이동하고, 화면 낭독기도 그 제목부터 읽게 한다.
  const goToQuestions=()=>{const heading=askHeadingRef.current;heading?.closest('section')?.scrollIntoView?.({behavior:'smooth',block:'start'});heading?.focus({preventScroll:true})};
  const recent=[...candidates].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,3);
  return <main className={styles.start}>
    <div className={styles.startTop}><a className={styles.brand} href="/" aria-label="집신 홈으로"><img src="/images/zipsin-company-logo.jpg" alt="집신 로고"/><span><b>집신</b><small>집신체크</small></span></a>{headerActions}</div>
    <div className={styles.homeLead}>
      <section className={styles.fieldHero}><div className={styles.heroMascot} role="img" aria-label="집신이 캐릭터"/><div><p className={styles.eyebrow}>로그인 없이 바로</p><h1>내가 본 집,<br/><em>카드처럼 비교해요.</em></h1><p>집 안에서는 빠르게 체크하고, 나온 뒤에는 같은 기준으로 차분히 비교해요.</p><div className={styles.startActions}><button type="button" className={styles.instantStart} onClick={onNew}>집신 체크</button><button type="button" className={styles.registerButton} onClick={goToQuestions}>질문 먼저 보기</button></div></div></section>
      <section className={styles.recentPreview} aria-label="최근 보러 갈 집"><header><div><p className={styles.sectionKicker}>최근</p><h2>보러 갈 집</h2></div>{candidates.length>0?<button type="button" onClick={onViewAll}>전체 {candidates.length}채 보기</button>:<span>최신 3개</span>}</header><div>{[0,1,2].map(index=>{const candidate=recent[index];return candidate?<article className={styles.recentHouseSlot} key={candidate.id}><button type="button" data-testid="recent-house-card" className={styles.recentHouseCard} aria-label={`최근 집 열기: ${candidate.alias}`} onClick={()=>onResume(candidate.id)}><span>{String(index+1).padStart(2,'0')}</span><strong>{candidate.alias}</strong><small><MapPin aria-hidden="true"/>{candidate.listing.location||'위치 미입력'}</small></button><button type="button" className={styles.recentDelete} aria-label={`삭제: ${candidate.alias}`} onClick={()=>onDelete(candidate.id)}><Trash2 aria-hidden="true"/>삭제</button></article>:<button type="button" className={styles.emptyHouseCard} aria-label={`보러 갈 집 ${index+1} 등록하기`} key={`empty-${index}`} onClick={onNew}><Plus aria-hidden="true"/><strong>보러 갈 집 {index+1}</strong><small>눌러서 등록하기</small></button>})}</div></section>
    </div>
    <aside className={styles.tipBanner}><span className={styles.tipIcon}><Lightbulb aria-hidden="true"/></span><div><b>먼저 읽어주세요</b><p>집 보러 가기 전에 체크리스트를 읽어봐 주세요</p><p>모든 체크를 다 할 필요는 없어요</p><small><Star aria-hidden="true"/> 빨간 별은 꼭 확인해 주세요.</small></div></aside>
    <section id="ask-before" className={styles.homeSection} aria-labelledby="ask-before-title">
      <header className={styles.homeSectionHead}><span className={styles.homeStep} aria-hidden="true">1</span><div><p>집 보러 가기 전</p><h2 id="ask-before-title" ref={askHeadingRef} tabIndex={-1}>꼭 물어볼 질문 8개</h2><small>집을 보여주는 분께 물어보세요. 답은 체크 화면의 &apos;질문 체크&apos;에 바로 적을 수 있어요.</small></div></header>
      <ol className={styles.askGrid}>{ASK_ITEMS.map((item,index)=><li key={item.id}><span aria-hidden="true">{index+1}</span><b>{item.title}</b><small>{item.prompt}</small></li>)}</ol>
    </section>
    <section id="check-preview" className={styles.homeSection} aria-labelledby="inside-title">
      <header className={styles.homeSectionHead}><span className={styles.homeStep} aria-hidden="true">2</span><div><p>집 안에서</p><h2 id="inside-title">눈으로 확인할 것 {INSIDE.length}개</h2><small><Star aria-hidden="true"/> 표시 {REQUIRED_COUNT}개는 꼭 보세요. 항목을 누르면 바로 체크가 시작돼요.</small></div></header>
      <ul className={styles.insideGrid}>{INSIDE.map((item,index)=><li key={item.id}><button type="button" aria-label={`${item.title} 체크 시작`} data-quick-trigger={`preview-${index}`} onClick={onInstant}><span className={styles.insideBox} aria-hidden="true"/><b>{item.title}</b>{item.priority==='required'?<em><Star aria-hidden="true"/>필수</em>:null}</button></li>)}</ul>
      <div className={styles.homeSectionActions}><button type="button" className={styles.homeGhost} data-quick-trigger="preview-detail" onClick={onInstant}>이름만 정하고 바로 체크</button></div>
    </section>
    <section className={styles.homeSection} aria-labelledby="after-title">
      <header className={styles.homeSectionHead}><span className={styles.homeStep} aria-hidden="true">3</span><div><p>집에서 나와서</p><h2 id="after-title">비교하고 한 집을 골라요</h2><small>본 집 2~3채를 같은 기준으로 나란히 보고, 마음에 드는 집은 &apos;이 집으로 확정&apos;을 누르세요.</small></div></header>
      <div className={styles.homeSectionActions}><button type="button" className={styles.homeGhost} onClick={candidates.length>=2?onCompare:onViewAll}>{candidates.length>=2?'본 집 비교하기':'본 집 목록 보기'}</button></div>
    </section>
    <button type="button" className={`${styles.instantStart} ${styles.homeFinalStart}`} onClick={onNew}>집신 체크로 시작</button>
    <aside className={styles.privacy}>체크·메모·사진은 이 브라우저에만 저장되고 외부로 전송되지 않아요.</aside>
  </main>;
}
