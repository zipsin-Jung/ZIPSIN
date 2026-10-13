'use client';

import {useState} from 'react';
import type {AuthProvider, ProviderState} from '@/features/auth/domain/providers';
import styles from './AccountFlow.module.css';

const LABEL: Record<AuthProvider, string> = {google: 'Google', kakao: 'Kakao', naver: 'Naver'};

export default function LoginPanel({states, onStart, onLater}:{states: ProviderState[]; onStart:(provider:AuthProvider)=>void|Promise<{redirectTo:string}|void>; onLater:()=>void}) {
  const [busy,setBusy]=useState<AuthProvider>();
  const [error,setError]=useState('');
  const start=async(provider:AuthProvider)=>{setBusy(provider);setError('');try{const result=await onStart(provider);if(result?.redirectTo)window.location.assign(result.redirectTo)}catch{setError('로그인을 시작하지 못했어요. 기록은 그대로 있으니 다시 시도해 주세요.')}finally{setBusy(undefined)}};
  return <div className={busy?styles.busy:undefined}>
    <div className={styles.providers}>
      {states.map(state=><button key={state.provider} type="button" className={styles.provider} disabled={!state.available||!!busy} onClick={()=>void start(state.provider)}>{LABEL[state.provider]}로 계속{state.available?'':' · 준비 중'}</button>)}
    </div>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <button type="button" className={styles.later} onClick={onLater}>나중에</button>
  </div>;
}
