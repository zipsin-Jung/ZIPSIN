'use client';
export default function RecordsError({reset}:{reset:()=>void}){return <div className="records-empty"><h1>기록을 불러오지 못했습니다</h1><p>Supabase 연결과 환경 변수를 확인한 뒤 다시 시도해 주세요.</p><button className="records-primary" onClick={reset}>다시 시도</button></div>}
