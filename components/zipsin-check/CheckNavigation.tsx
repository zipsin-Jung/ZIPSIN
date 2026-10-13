'use client';
import styles from './ZipsinCheck.module.css';

type Destination='home'|'list'|'check'|'compare';
export default function CheckNavigation({current,hasActive,canCompare,onHome,onList,onCheck,onCompare}:{current:Destination;hasActive:boolean;canCompare:boolean;onHome:()=>void;onList:()=>void;onCheck:()=>void;onCompare:()=>void}){const item=(key:Destination,label:string,icon:string,onClick:()=>void,disabled=false)=><button type="button" aria-label={label} aria-current={current===key?'page':undefined} disabled={disabled} onClick={onClick}><b aria-hidden="true">{icon}</b><span>{label.replace('집신체크 ','').replace('현재 집 ','').replace('후보 ','')}</span></button>;return <nav className={styles.checkNav} aria-label="집신체크 주요 메뉴">{item('home','집신체크 홈','⌂',onHome)}{item('list','내가 본 집','▤',onList)}{item('check','현재 집 체크','☑',onCheck,!hasActive)}{item('compare','후보 비교','⇄',onCompare,!canCompare)}</nav>}
