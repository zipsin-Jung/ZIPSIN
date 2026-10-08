import RepairForm from '@/components/records/RepairForm';
import {createRepairAction} from '../actions';
export const metadata={title:'새 수리 기록 | 집신'};
export default function NewRecordPage(){return <section className="records-narrow"><div className="records-page-head"><div><span className="records-kicker">CREATE</span><h1>새 수리 기록</h1><p>가상 정보를 Supabase에 저장합니다.</p></div></div><RepairForm action={createRepairAction}/></section>}
