'use client';
import {useEffect,useState} from 'react';
import {readLocalCheckSource} from '@/features/check-transfer/client/local-source';
import {loadTransferResume,saveTransferResume} from '@/features/check-transfer/client/resume-store';
import {buildLocalTransferManifest} from '@/features/check-transfer/domain/build-local-manifest';
import {runTransfer} from '@/features/check-transfer/client/run-transfer';
import TransferProgress from './TransferProgress';
const RESULT_KEY='zipsin-check:transfer-result:v1';
export default function TransferProgressClient(){const[stage,setStage]=useState('기록 확인 중'),[error,setError]=useState('');useEffect(()=>{let active=true;(async()=>{try{const resume=loadTransferResume();if(!resume)throw new Error('이전할 기록을 찾지 못했어요.');const source=readLocalCheckSource();const manifest=await buildLocalTransferManifest({state:source.state,candidateIds:resume.candidateIds,excludedPhotoIds:resume.excludedPhotoIds,photoStore:source.photoStore,requestKey:resume.requestKey});const result=await runTransfer(manifest,undefined,value=>active&&setStage(value));saveTransferResume({...resume,manifestId:result.manifestId});sessionStorage.setItem(RESULT_KEY,JSON.stringify(result));window.location.assign('/ck/transfer/result')}catch(reason){if(active)setError(reason instanceof Error&&reason.message==='AUTH_REQUIRED'?'로그인이 만료됐어요. 다시 로그인하면 같은 기록으로 이어갈 수 있어요.':'저장을 완료하지 못했어요. 로컬 기록은 그대로 있으며 다시 시도할 수 있어요.')}})();return()=>{active=false}},[]);return <TransferProgress stage={stage} error={error}/>}
