'use client';
import {useEffect,useState} from 'react';
import {ArrowLeftRight,ChevronRight,MapPin,MessageCircleQuestion,Plus,Trash2} from 'lucide-react';
import type {PhotoStore} from '@/lib/zipsin-check/photo-store';
import {summarizeAnswers} from '@/lib/zipsin-check/summary';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

type ListProps={candidates:CandidateV2[];onNew:()=>void;onResume:(id:string,view?:'questions')=>void;onDelete:(id:string)=>void;onCompare?:()=>void;photoStore?:Pick<PhotoStore,'count'>};

const dateLabel=(iso:string)=>{const d=new Date(iso);return Number.isNaN(d.getTime())?'':`${d.getMonth()+1}월 ${d.getDate()}일`};

export default function CandidateList({candidates,onNew,onResume,onDelete,onCompare,photoStore}:ListProps){
  const sorted=[...candidates].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const [photoCounts,setPhotoCounts]=useState<Record<string,number>>({});
  const ids=sorted.map(c=>c.id).join(',');
  useEffect(()=>{
    if(!photoStore||!ids)return;
    let active=true;
    Promise.all(ids.split(',').map(async id=>[id,await photoStore.count(id).catch(()=>0)] as const)).then(entries=>{if(active)setPhotoCounts(Object.fromEntries(entries))});
    return()=>{active=false};
  },[photoStore,ids]);
  const latest=sorted[0];
  const latestSummary=latest?summarizeAnswers(latest.answers):undefined;
  const remainingQuestions=latestSummary?latestSummary.askTotal-latestSummary.asked:0;

  return <main className={styles.candidateList}>
    {sorted.length>0&&<section className={styles.localBanner} aria-labelledby="local-banner-title"><div><b id="local-banner-title">이 휴대폰에만 저장돼 있어요</b><span>다른 기기에서도 보려면 집신에 저장하세요</span></div><a href={`/login?next=${encodeURIComponent('/ck/transfer')}`}>집신 저장</a></section>}
    <header className={styles.listHeader}><div><p className={styles.sectionKicker}>MY HOMES</p><h1>내가 본 집 {sorted.length}채</h1><p>저장한 집을 다시 열어 수정하거나 비교할 수 있어요.</p></div><button type="button" onClick={onNew}><Plus aria-hidden="true"/>새 집 추가</button></header>
    {sorted.length===0?<section className={styles.listEmpty}><strong>아직 등록한 집이 없어요</strong><p>첫 집을 등록하고 현장에서 바로 체크해 보세요.</p><button type="button" onClick={onNew}>첫 집 등록하기</button></section>:<>
    <section className={styles.listGrid} aria-label="저장한 집 전체 목록">{sorted.map((candidate,index)=>{const s=summarizeAnswers(candidate.answers);const photos=photoCounts[candidate.id];return <article className={styles.listCard} key={candidate.id} aria-label={candidate.alias}>
      <button type="button" className={styles.listOpen} aria-label={`${candidate.alias} ${candidate.listing.location||'위치 미입력'}`} onClick={()=>onResume(candidate.id)}>
        <span className={styles.listNumber}>{String(index+1).padStart(2,'0')}</span><strong>{candidate.alias}</strong>
        <small><MapPin aria-hidden="true"/>{candidate.listing.location||'위치 미입력'}{dateLabel(candidate.createdAt)?` · ${dateLabel(candidate.createdAt)}`:''}</small>
        <span className={styles.listMeter} aria-hidden="true"><i style={{width:`${Math.round(s.checked/s.checkTotal*100)}%`}}/></span>
      </button>
      <dl className={styles.listStats}>
        <div><dt>집 체크</dt><dd>{s.checked}/{s.checkTotal}</dd></div>
        <div className={s.problems?styles.statWarn:undefined}><dt>문제</dt><dd aria-label={`문제 ${s.problems}개`}>{s.problems}</dd></div>
        <div><dt>질문</dt><dd>{s.asked}/{s.askTotal}</dd></div>
        <div><dt>사진</dt><dd aria-label={photos===undefined?'사진 수 확인 중':`사진 ${photos}장`}>{photos??'–'}</dd></div>
      </dl>
      <button type="button" className={styles.listDelete} aria-label={`${candidate.alias} 영구 삭제`} onClick={()=>onDelete(candidate.id)}><Trash2 aria-hidden="true"/>삭제</button>
    </article>})}</section>
    <section className={styles.nextSteps} aria-labelledby="next-steps-title"><h2 id="next-steps-title">다음에 할 일</h2>
      {sorted.length>=2&&onCompare?<button type="button" onClick={onCompare}><span><ArrowLeftRight aria-hidden="true"/></span><b>{sorted.length>3?'3채 골라 비교하기':`${sorted.length}채 비교하기`}<small>같은 기준으로 한눈에</small></b><ChevronRight aria-hidden="true"/></button>
        :<button type="button" onClick={onNew}><span><Plus aria-hidden="true"/></span><b>다른 집도 체크하기<small>2채부터 나란히 비교할 수 있어요</small></b><ChevronRight aria-hidden="true"/></button>}
      {latest&&remainingQuestions>0&&<button type="button" onClick={()=>onResume(latest.id,'questions')}><span><MessageCircleQuestion aria-hidden="true"/></span><b>{latest.alias} 남은 질문 {remainingQuestions}개<small>중개사에게 물어보기</small></b><ChevronRight aria-hidden="true"/></button>}
    </section></>}
  </main>;
}
