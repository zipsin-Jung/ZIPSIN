import TransferPageClient from '@/components/check-transfer/TransferPageClient';
import {isAccountOpen} from '@/lib/site/account-launch';
import styles from '@/components/check-transfer/Transfer.module.css';

export default async function TransferPage({searchParams}:{searchParams:Promise<{candidate?:string;candidates?:string}>}){const params=await searchParams;const requestedIds=(params.candidates?.split(',')??(params.candidate?[params.candidate]:[])).filter(Boolean).slice(0,3);return <main className={styles.page}><div className={styles.shell}><header className={styles.top}><a href="/ck">← 체크로 돌아가기</a><strong>집신에 저장</strong></header>{isAccountOpen()?<TransferPageClient requestedIds={requestedIds}/>:<section role="status" style={{padding:'32px 4px',lineHeight:1.7}}><h1 style={{fontSize:24,fontWeight:900}}>집신 저장은 준비 중이에요</h1><p>곧 열려요. 체크한 집은 이 휴대폰에 그대로 남아 있어요.</p></section>}</div></main>}
