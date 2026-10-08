import Link from 'next/link';
import Brand from '@/components/Brand';
export default function RecordsHeader(){return <><header className="records-header"><Link href="/" aria-label="집신 랜딩페이지"><Brand/></Link><nav aria-label="수리 기록 메뉴"><Link href="/records">목록</Link><Link href="/records/new" className="records-primary">새 기록</Link></nav></header><div className="records-demo-notice">부트캠프 미션용 공개 데모입니다. 가상 정보만 입력해 주세요.
  </div></>}
