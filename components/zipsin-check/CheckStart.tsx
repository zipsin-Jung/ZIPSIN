'use client';
import {BookOpenCheck,Camera,Columns3,Lightbulb,MapPin,MousePointerClick,Plus,Star} from 'lucide-react';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

const HOW_TO=[['01',BookOpenCheck,'미리 읽기','집 보러 가기 전에 읽어 보고 가면 좋아요'],['02',MousePointerClick,'네모만 체크','전부 다 체크하진 않아도 돼요'],['03',Camera,'사진·메모','급하면 기억할 것만 바로 남겨요.'],['04',Columns3,'카드처럼 비교','나온 뒤 2~3채를 같은 기준으로 보세요.']] as const;
const PREVIEW=['물·배수','곰팡이·누수','채광·소음','창문·문','옵션·파손'];

export default function CheckStart({candidates,onNew,onInstant,onResume,onDelete}:{candidates:CandidateV2[];onNew:()=>void;onInstant:()=>void;onResume:(id:string)=>void;onDelete:(id:string)=>void}){
  const recent=[...candidates].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt)).slice(0,3);
  return <main className={styles.start}>
    <a className={styles.brand} href="/" aria-label="집신 홈으로"><img src="/images/zipsin-company-logo.jpg" alt="집신 로고"/><span><b>집신</b><small>ZIPSIN CHECK</small></span></a>
    <div className={styles.homeLead}>
      <section className={styles.fieldHero}><div className={styles.heroMascot} role="img" aria-label="집신이 캐릭터"/><div><p className={styles.eyebrow}>로그인 없이 바로</p><h1>내가 본 집,<br/><em>카드처럼 비교해요.</em></h1><p>집 안에서는 빠르게 체크하고, 나온 뒤에는 같은 기준으로 차분히 비교해요.</p><div className={styles.startActions}><button type="button" className={styles.instantStart} onClick={onInstant}>바로 체크</button><button type="button" className={styles.registerButton} onClick={onNew}>집 정보부터 등록</button></div></div></section>
      <section className={styles.recentPreview} aria-label="최근 보러 갈 집"><header><div><p className={styles.sectionKicker}>RECENT</p><h2>보러 갈 집</h2></div><span>최신 3개</span></header><div>{[0,1,2].map(index=>{const candidate=recent[index];return candidate?<button type="button" data-testid="recent-house-card" className={styles.recentHouseCard} aria-label={`최근 집 열기: ${candidate.alias}`} key={candidate.id} onClick={()=>onResume(candidate.id)}><span>{String(index+1).padStart(2,'0')}</span><strong>{candidate.alias}</strong><small><MapPin aria-hidden="true"/>{candidate.listing.location||'위치 미입력'}</small></button>:<button type="button" className={styles.emptyHouseCard} aria-label={`보러 갈 집 ${index+1} 등록하기`} key={`empty-${index}`} onClick={onNew}><Plus aria-hidden="true"/><strong>보러 갈 집 {index+1}</strong><small>눌러서 등록하기</small></button>})}</div></section>
    </div>
    <aside className={styles.tipBanner}><div className={styles.tipMascot} role="img" aria-label="안내하는 집신이 캐릭터"/><div><b><Lightbulb aria-hidden="true"/> 먼저 읽어주세요</b><p>집 보러 가기 전에 체크리스트를 읽어봐 주세요</p><p>모든 체크를 다 할 필요는 없어요</p><small><Star aria-hidden="true"/> 빨간 별은 꼭 확인해 주세요.</small></div></aside>
    <section className={styles.howTo}><p className={styles.sectionKicker}>HOW TO</p><h2>이렇게 쓰면 돼요</h2><div>{HOW_TO.map(([number,Icon,title,copy])=><article key={number}><span><Icon aria-hidden="true"/></span><small>{number}</small><strong>{title}</strong><p>{copy}</p></article>)}</div></section>
    <section className={styles.checkPreview}><div><p className={styles.sectionKicker}>CHECK PREVIEW</p><h2>이런 것을 확인해요</h2></div><ul>{PREVIEW.map(item=><li key={item}><span>□</span><b>{item}</b><small>★ 필수</small></li>)}</ul></section>
    {candidates.length>0&&<section className={styles.resume}><h2>내가 본 집 {candidates.length}채</h2>{candidates.map(candidate=><div className={styles.resumeRow} key={candidate.id}><button type="button" onClick={()=>onResume(candidate.id)}><strong>{candidate.alias}</strong><span>{candidate.listing.location||'위치 미입력'}</span></button><button type="button" aria-label={`${candidate.alias} 영구 삭제`} onClick={()=>onDelete(candidate.id)}>삭제</button></div>)}</section>}
    <aside className={styles.privacy}>체크·메모·사진은 이 브라우저에만 저장되고 외부로 전송되지 않아요.</aside>
  </main>;
}
