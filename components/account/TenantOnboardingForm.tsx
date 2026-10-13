'use client';

import {useState} from 'react';
import type {AccountUserType} from '@/features/account/domain/profile';
import styles from '@/components/auth/AccountFlow.module.css';

export type OnboardingInput={userType:AccountUserType;transferConsent:boolean;marketingConsent:boolean};

export default function TenantOnboardingForm({onSubmit}:{onSubmit:(value:OnboardingInput)=>void|Promise<void>}) {
  const [userType,setUserType]=useState<AccountUserType>('house_hunter');
  const [transferConsent,setTransferConsent]=useState(false);
  const [marketingConsent,setMarketingConsent]=useState(false);
  const [error,setError]=useState('');
  const submit=()=>{if(!transferConsent){setError('기록 이전 동의가 필요해요.');return}setError('');void onSubmit({userType,transferConsent,marketingConsent})};
  return <div>
    <div className={styles.choice} role="radiogroup" aria-label="현재 상황">
      <label><input type="radio" name="userType" checked={userType==='house_hunter'} onChange={()=>setUserType('house_hunter')}/>집 구하는 중</label>
      <label><input type="radio" name="userType" checked={userType==='tenant'} onChange={()=>setUserType('tenant')}/>현재 임차인</label>
    </div>
    <p className={styles.notice}>이 선택은 맞춤 안내용이며 특정 집이나 계약의 접근 권한을 만들지 않아요.</p>
    <div className={styles.consents}>
      <label><input required type="checkbox" checked={transferConsent} onChange={e=>setTransferConsent(e.target.checked)}/><span>선택한 후보 기록을 내 집신 계정에 저장하는 데 동의합니다.</span></label>
      <label><input type="checkbox" checked={marketingConsent} onChange={e=>setMarketingConsent(e.target.checked)}/><span>집신 소식 받기(선택)</span></label>
    </div>
    {error&&<p role="alert" className={styles.error}>{error}</p>}
    <button type="button" className={styles.primary} onClick={submit}>확인하고 계속</button>
  </div>;
}
