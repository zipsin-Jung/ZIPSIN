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
  return <main className={styles.page}><section className={styles.card}><a className={styles.brand} href="/ck">집신 · ZIPSIN CHECK</a><p className={styles.eyebrow}>집신 계정 하나로</p><h1>간편 가입하고 집신체크를 이어보세요.</h1><p className={styles.description}>Google·Kakao로 집신 계정을 먼저 만들어 두세요. 지금 보던 집 기록은 이 기기에 그대로 남습니다. 집신 본 서비스와 내 집 자동 등록은 준비 중입니다.</p>{params.error&&<p role="alert" className={styles.error}>로그인을 완료하지 못했어요. 다시 시도해 주세요.</p>}<LoginPanel states={states} onStart={begin} onLater={later}/></section></main>;
}
