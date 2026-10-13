'use client';
import {useState} from 'react';
import type {LocalTransferManifest} from '@/features/check-transfer/domain/types';
import PhotoSelection from './PhotoSelection';import PrivacyNotice from './PrivacyNotice';import TransferConsent from './TransferConsent';import styles from './Transfer.module.css';

export default function TransferPreview({manifest,onContinue}:{manifest:LocalTransferManifest;onContinue:(value:{candidateIds:string[];excludedPhotoIds:string[];requestKey:string})=>void}){
  const[excluded,setExcluded]=useState<string[]>([]),[consent,setConsent]=useState(false),[error,setError]=useState('');
  const submit=()=>{if(!consent){setError('기록 이전 동의가 필요해요.');return}setError('');onContinue({candidateIds:manifest.candidates.map(c=>c.localCandidateId),excludedPhotoIds:excluded,requestKey:manifest.requestKey})};
  return <><PrivacyNotice/><section className={styles.intro}><h1>옮길 기록을 확인해 주세요.</h1><p>집 후보와 체크·메모·선택한 사진만 옮겨요. 계약이나 집 권한은 만들지 않아요.</p></section>{manifest.warnings.map(w=><p key={w} role="alert" className={styles.warning}>{w}</p>)}{manifest.candidates.map(candidate=><article className={styles.candidate} key={candidate.localCandidateId}><h2>{candidate.alias}</h2><div className={styles.meta}><span>{candidate.listing.location||'위치 미입력'}</span><span>체크 {candidate.answers.length}개 · 사진 {candidate.photos.filter(p=>!excluded.includes(p.id)).length}장</span></div>{candidate.photos.map((photo,index)=><PhotoSelection key={photo.id} photo={photo} index={index} included={!excluded.includes(photo.id)} onChange={included=>setExcluded(current=>included?current.filter(id=>id!==photo.id):[...current,photo.id])}/>)}</article>)}<TransferConsent checked={consent} onChange={setConsent}/>{error&&<p role="alert" className={styles.error}>{error}</p>}<button type="button" className={styles.primary} onClick={submit}>선택한 기록 저장</button><a className={styles.later} href="/ck">나중에</a></>;
}
