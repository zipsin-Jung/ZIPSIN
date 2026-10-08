import Link from 'next/link';
import {redirect} from 'next/navigation';
import {listRepairs, RECORDS_PER_PAGE} from '@/lib/repairs/repository';
import {parseListParams} from '@/lib/repairs/schema';
import {categoryLabels, repairStatuses, statusLabels} from '@/lib/repairs/types';

export const metadata={title:'수리 기록 | 집신'};
export default async function RecordsPage({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const raw=await searchParams; const options=parseListParams({page:first(raw.page),status:first(raw.status),query:first(raw.query)});
  const {records,count}=await listRepairs(options); const totalPages=Math.max(1,Math.ceil(count/RECORDS_PER_PAGE));
  if (count > 0 && options.page > totalPages) { const next = new URLSearchParams({page:String(totalPages)}); if(options.query)next.set('query',options.query); if(options.status!=='all')next.set('status',options.status); redirect(`/records?${next}`); }
  return <>{raw.deleted&&<p className="records-success" role="status">수리 기록을 삭제했습니다.</p>}{raw.cleanup&&<p className="records-alert" role="alert">기록은 반영됐지만 이전 이미지 정리가 완료되지 않았습니다. 관리자 확인이 필요합니다.</p>}<section className="records-page-head"><div><span className="records-kicker">실제 DB 저장 데모</span><h1>집의 수리 기록</h1><p>가상 기록을 등록하고 상세·수정·삭제까지 확인해 보세요.</p></div><Link className="records-primary" href="/records/new">새 수리 기록</Link></section>
  <form className="records-filters" action="/records"><label>기록 검색<input name="query" defaultValue={options.query} placeholder="제목 또는 집 별칭"/></label><label>상태<select name="status" defaultValue={options.status}><option value="all">전체</option>{repairStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select></label><button className="records-secondary" type="submit">검색</button>{(options.query||options.status!=='all')&&<Link href="/records">조건 초기화</Link>}</form>
  {records.length===0?<div className="records-empty"><h2>{options.query||options.status!=='all'?'조건에 맞는 기록이 없습니다':'아직 수리 기록이 없습니다'}</h2><p>개인정보 없는 가상 기록으로 CRUD 흐름을 시작해 보세요.</p><Link className="records-primary" href="/records/new">첫 기록 등록</Link></div>:<div className="records-grid">{records.map(record=><Link className="records-card" href={`/records/${record.id}`} key={record.id}><div><span className={`records-status status-${record.status}`}>{statusLabels[record.status]}</span><span>{categoryLabels[record.category]}</span></div><h2>{record.title}</h2><p>{record.home_alias}</p><footer><time>{record.repair_date}</time><span>{record.image_path?'사진 있음':'사진 없음'}</span></footer></Link>)}</div>}
  {totalPages>1&&<nav className="records-pagination" aria-label="목록 페이지"><PageLink disabled={options.page<=1} page={options.page-1} options={options}>이전</PageLink><span>{Math.min(options.page,totalPages)} / {totalPages}</span><PageLink disabled={options.page>=totalPages} page={options.page+1} options={options}>다음</PageLink></nav>}</>;
}
function first(value:string|string[]|undefined){return Array.isArray(value)?value[0]:value}
function PageLink({page,options,disabled,children}:{page:number;options:ReturnType<typeof parseListParams>;disabled:boolean;children:React.ReactNode}){if(disabled)return <span aria-disabled="true">{children}</span>;const p=new URLSearchParams({page:String(page)});if(options.query)p.set('query',options.query);if(options.status!=='all')p.set('status',options.status);return <Link href={`/records?${p}`}>{children}</Link>}
