import Link from 'next/link';
export default function RecordNotFound(){return <div className="records-empty"><span className="records-kicker">404</span><h1>수리 기록을 찾을 수 없습니다</h1><p>주소가 잘못되었거나 이미 삭제된 기록입니다.</p><Link className="records-primary" href="/records">목록으로 돌아가기</Link></div>}
