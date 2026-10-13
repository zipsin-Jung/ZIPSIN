'use client';
import styles from './Transfer.module.css';
export default function TransferProgress({stage,error}:{stage:string;error?:string}){return <section className={styles.empty}><p className={styles.eyebrow}>집신에 안전하게 저장 중</p><h1>잠시만 기다려 주세요.</h1><p aria-live="polite">{stage}</p>{error&&<><p role="alert" className={styles.error}>{error}</p><a href="/ck/transfer/progress">다시 시도</a></>}</section>}
