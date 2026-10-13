'use client';
import {useEffect,useState} from 'react';import type {TransferResult as Result} from '@/features/check-transfer/server/service';import TransferResult from './TransferResult';import styles from './Transfer.module.css';
const KEY='zipsin-check:transfer-result:v1';
export default function TransferResultClient(){const[result,setResult]=useState<Result>();useEffect(()=>{try{const raw=sessionStorage.getItem(KEY);if(raw)setResult(JSON.parse(raw) as Result)}catch{}},[]);return result?<TransferResult result={result}/>:<section className={styles.empty}><p role="alert">저장 결과를 찾지 못했어요.</p><a href="/my/candidates">내 후보집에서 확인</a></section>}
