import {redirect} from 'next/navigation';
import TenantOnboardingForm from '@/components/account/TenantOnboardingForm';
import styles from '@/components/auth/AccountFlow.module.css';
import {getSafeReturnPath} from '@/features/auth/domain/return-path';
import {saveOnboarding} from '@/features/account/server/save-onboarding';

export default async function TenantOnboardingPage({searchParams}:{searchParams:Promise<{returnTo?:string}>}){
  const params=await searchParams;const returnTo=getSafeReturnPath(params.returnTo??null,'/ck/transfer');
  const requiresTransferConsent=returnTo.startsWith('/ck/transfer');
  const save=async(input:Parameters<typeof saveOnboarding>[0])=>{'use server';await saveOnboarding(input,{requiresTransferConsent});redirect(returnTo)};
  return <main className={styles.page}><section className={styles.card}><a className={styles.brand} href="/ck">집신 · ZIPSIN CHECK</a><p className={styles.eyebrow}>처음 한 번만</p><h1>지금 상황을 알려주세요.</h1><p className={styles.description}>집신체크에서 저장한 후보는 아직 계약이나 집 이력이 아닌 나만의 후보 기록이에요.</p><TenantOnboardingForm onSubmit={save} requiresTransferConsent={requiresTransferConsent}/></section></main>;
}
