import Link from 'next/link';
import {notFound} from 'next/navigation';
import DeleteButton from '@/components/records/DeleteButton';
import {getRepair} from '@/lib/repairs/repository';
import {categoryLabels,statusLabels} from '@/lib/repairs/types';

export async function generateMetadata({params}:{params:Promise<{id:string}>}) {
  const {id}=await params; const record=await getRepair(id);
  return {title:record?`${record.title} | 집신`:'기록을 찾을 수 없음 | 집신',description:record?`${record.home_alias}의 ${categoryLabels[record.category]} 수리 기록`:'없는 수리 기록입니다.'};
}

export default async function RecordDetailPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<Record<string,string|undefined>>}) {
  const {id}=await params; const record=await getRepair(id); if(!record)notFound(); const notice=await searchParams;
  return <article className="records-detail">
    {notice.created&&<p className="records-success" role="status">수리 기록을 등록했습니다.</p>}
    {notice.updated&&<p className="records-success" role="status">변경 내용을 저장했습니다.</p>}
    {notice.cleanup&&<p className="records-alert" role="alert">변경은 반영됐지만 이전 이미지 정리가 완료되지 않았습니다. 관리자 확인이 필요합니다.</p>}
    <div className="records-detail-head"><div><span className={`records-status status-${record.status}`}>{statusLabels[record.status]}</span><h1>{record.title}</h1><p>{record.home_alias} · {categoryLabels[record.category]}</p></div><div className="records-actions"><Link className="records-secondary" href={`/records/${record.id}/edit`}>수정</Link><DeleteButton id={record.id}/></div></div>
    {record.image_url?<img className="records-detail-image" src={record.image_url} alt={`${record.title} 수리 사진`}/>:<div className="records-no-image">첨부 이미지 없음</div>}
    <section className="records-description"><h2>수리 내용</h2><p>{record.description}</p></section>
    <dl className="records-meta"><div><dt>수리일</dt><dd>{record.repair_date}</dd></div><div><dt>등록</dt><dd>{formatDate(record.created_at)}</dd></div><div><dt>최근 수정</dt><dd>{formatDate(record.updated_at)}</dd></div></dl>
    <Link href="/records" className="records-back">← 목록으로</Link>
  </article>;
}

function formatDate(value:string){return new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Seoul'}).format(new Date(value))}
