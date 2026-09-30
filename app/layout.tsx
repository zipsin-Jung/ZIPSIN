import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'집신 ZIPSIN | 집의 기록을 한곳에',description:'계약, 사진, 수리, 일정까지 집 한 채의 기록을 연결하는 주거 기록 관리 서비스 집신',openGraph:{title:'집신 ZIPSIN | 사람이 바뀌어도, 집의 기록은 남습니다.',description:'계약부터 입주, 수리, 관리, 퇴거까지. 집 한 채의 모든 기록을 한곳에.',type:'website',locale:'ko_KR'},icons:{icon:'/images/zipsin-company-logo.jpg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
