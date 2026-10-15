'use client';
import {MapPin,Plus,Trash2} from 'lucide-react';
import {getItemsForDepth} from '@/lib/zipsin-check/catalog';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import styles from './ZipsinCheck.module.css';

export default function CandidateList({candidates,onNew,onResume,onDelete}:{candidates:CandidateV2[];onNew:()=>void;onResume:(id:string)=>void;onDelete:(id:string)=>void}){
  const sorted=[...candidates].sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt));
  const core=getItemsForDepth('quick');
  return <main className={styles.candidateList}>
    <header className={styles.listHeader}><div><p className={styles.sectionKicker}>MY HOMES</p><h1>내가 본 집 {sorted.length}채</h1><p>저장한 집을 다시 열어 수정하거나 비교할 수 있어요.</p></div><button type="button" onClick={onNew}><Plus aria-hidden="true"/>새 집 추가</button></header>
    {sorted.length===0?<section className={styles.listEmpty}><strong>아직 등록한 집이 없어요</strong><p>첫 집을 등록하고 현장에서 바로 체크해 보세요.</p><button type="button" onClick={onNew}>첫 집 등록하기</button></section>:<section className={styles.listGrid} aria-label="저장한 집 전체 목록">{sorted.map((candidate,index)=>{const checked=core.filter(item=>{const status=candidate.answers[item.id]?.status;return status&&status!=='unverified'}).length;return <article className={styles.listCard} key={candidate.id}><button type="button" className={styles.listOpen} aria-label={`${candidate.alias} ${candidate.listing.location||'위치 미입력'}`} onClick={()=>onResume(candidate.id)}><span className={styles.listNumber}>{String(index+1).padStart(2,'0')}</span><strong>{candidate.alias}</strong><small><MapPin aria-hidden="true"/>{candidate.listing.location||'위치 미입력'}</small><em>{checked}/5 확인</em></button><button type="button" className={styles.listDelete} aria-label={`${candidate.alias} 영구 삭제`} onClick={()=>onDelete(candidate.id)}><Trash2 aria-hidden="true"/>삭제</button></article>})}</section>}
  </main>;
}
