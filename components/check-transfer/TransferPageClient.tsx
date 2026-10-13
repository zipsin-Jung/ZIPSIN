'use client';
import {useEffect,useState} from 'react';
import {buildLocalTransferManifest} from '@/features/check-transfer/domain/build-local-manifest';
import type {LocalTransferManifest} from '@/features/check-transfer/domain/types';
import {readLocalCheckSource} from '@/features/check-transfer/client/local-source';
import {saveTransferResume} from '@/features/check-transfer/client/resume-store';
import TransferPreview from './TransferPreview';import styles from './Transfer.module.css';

export default function TransferPageClient({requestedIds}:{requestedIds:string[]}){
  const[manifest,setManifest]=useState<LocalTransferManifest>(),[error,setError]=useState('');
  useEffect(()=>{let active=true;(async()=>{try{const source=readLocalCheckSource();const ids=requestedIds.length?requestedIds:source.state.activeCandidateId?[source.state.activeCandidateId]:source.state.compareCandidateIds.slice(0,3);if(!ids.length){setError('옮길 후보 기록이 없어요. 먼저 집을 체크해 주세요.');return}const value=await buildLocalTransferManifest({state:source.state,candidateIds:ids,excludedPhotoIds:[],photoStore:source.photoStore,requestKey:crypto.randomUUID()});if(active)setManifest(value)}catch{if(active)setError('기록을 불러오지 못했어요. 원본은 그대로 있으니 체크 화면에서 다시 시도해 주세요.')}})();return()=>{active=false}},[requestedIds]);
  if(error)return <div className={styles.empty}><p role="alert">{error}</p><a href="/ck">체크 화면으로</a></div>;
  if(!manifest)return <p className={styles.loading} aria-live="polite">기록을 불러오는 중…</p>;
  return <TransferPreview manifest={manifest} onContinue={value=>{saveTransferResume(value);window.location.assign(`/login?returnTo=${encodeURIComponent('/ck/transfer/progress')}`)}}/>;
}
