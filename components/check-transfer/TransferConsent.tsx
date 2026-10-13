import styles from './Transfer.module.css';
export default function TransferConsent({checked,onChange}:{checked:boolean;onChange:(value:boolean)=>void}){return <label className={styles.consent}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>선택한 후보 기록을 내 계정에 저장하는 데 동의합니다. 마케팅 동의와는 별개예요.</span></label>}
