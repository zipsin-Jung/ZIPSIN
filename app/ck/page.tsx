import type {Metadata} from 'next';
import ZipsinCheckApp from '@/components/zipsin-check/ZipsinCheckApp';

export const metadata:Metadata={title:'집신체크 | 로그인 없이 바로 쓰는 집 보기 체크리스트',description:'보고 온 집을 밝고 쉬운 체크카드로 정리하고 최대 3채까지 비교하세요.',alternates:{canonical:'/ck'}};
export default function CheckPublicPage(){return <ZipsinCheckApp/>;}
