import type {TransferPhotoInput} from '@/features/check-transfer/domain/types';
import styles from './Transfer.module.css';
export default function PhotoSelection({photo,index,included,onChange}:{photo:TransferPhotoInput;index:number;included:boolean;onChange:(included:boolean)=>void}){return <label className={styles.photo}><input type="checkbox" checked={included} onChange={e=>onChange(e.target.checked)}/><span>사진 {index+1} 포함 · {Math.max(1,Math.round(photo.bytes/1024))}KB</span></label>}
