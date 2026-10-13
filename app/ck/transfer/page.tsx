import TransferPageClient from '@/components/check-transfer/TransferPageClient';
import styles from '@/components/check-transfer/Transfer.module.css';

export default async function TransferPage({searchParams}:{searchParams:Promise<{candidate?:string;candidates?:string}>}){const params=await searchParams;const requestedIds=(params.candidates?.split(',')??(params.candidate?[params.candidate]:[])).filter(Boolean).slice(0,3);return <main className={styles.page}><div className={styles.shell}><header className={styles.top}><a href="/ck">← 체크로 돌아가기</a><strong>집신에 저장</strong></header><TransferPageClient requestedIds={requestedIds}/></div></main>}
