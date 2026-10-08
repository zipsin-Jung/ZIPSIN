import {notFound} from 'next/navigation';
import RepairForm from '@/components/records/RepairForm';
import {getRepair} from '@/lib/repairs/repository';
import {updateRepairAction} from '../../actions';
export const metadata={title:'수리 기록 수정 | 집신'};
export default async function EditRecordPage({params}:{params:Promise<{id:string}>}){const {id}=await params;const record=await getRepair(id);if(!record)notFound();const action=updateRepairAction.bind(null,id);return <section className="records-narrow"><div className="records-page-head"><div><span className="records-kicker">UPDATE</span><h1>수리 기록 수정</h1><p>기존 내용을 불러와 안전하게 변경합니다.</p></div></div><RepairForm action={action} record={record}/></section>}
