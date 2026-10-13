import {redirect} from 'next/navigation';
import LoginPanel from '@/components/auth/LoginPanel';
import styles from '@/components/auth/AccountFlow.module.css';
import {getSafeReturnPath} from '@/features/auth/domain/return-path';
import {listProviderStates} from '@/features/auth/domain/providers';
import {startOAuth} from '@/features/auth/server/start-oauth';
import {readServerEnv} from '@/lib/env/server';

export default async function LoginPage({searchParams}:{searchParams:Promise<{returnTo?:string;error?:string}>}) {
  const params=await searchParams;
  const returnTo=getSafeReturnPath(params.returnTo??null);
  const states=listProviderStates(readServerEnv().oauthProviders);
  const begin=async(provider: Parameters<typeof startOAuth>[0])=>{'use server';return startOAuth(provider,returnTo)};
  const later=async()=>{'use server';redirect('/ck?auth=cancelled')};
  return <main className={styles.page}><section className={styles.card}><a className={styles.brand} href="/ck">집신 · ZIPSIN CHECK</a><p className={styles.eyebrow}>집신 계정 하나로</p><h1>보고 온 집을 안전하게 이어보세요.</h1><p className={styles.description}>집신체크 기록은 로그인 전까지 이 기기에만 저장됩니다. 집신 계정 연동과 내 집 등록은 준비 중입니다.</p>{params.error&&<p role="alert" className={styles.error}>로그인을 완료하지 못했어요. 다시 시도해 주세요.</p>}<LoginPanel states={states} onStart={begin} onLater={later}/></section></main>;
}
