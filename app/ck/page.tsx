import {isAccountOpen} from '@/lib/site/account-launch';
import type {Metadata,Viewport} from 'next';
import ZipsinCheckApp from '@/components/zipsin-check/ZipsinCheckApp';
import {createServerSupabaseClient} from '@/lib/supabase/server';

export const metadata:Metadata={title:'집신체크 | 로그인 없이 바로 쓰는 집 보기 체크리스트',description:'보고 온 집을 밝고 쉬운 체크카드로 정리하고 최대 3채까지 비교하세요.',alternates:{canonical:'/ck'},manifest:'/ck/manifest.webmanifest',appleWebApp:{capable:true,title:'집신체크',statusBarStyle:'default'}};
export const viewport:Viewport={themeColor:'#173e31'};
export default async function CheckPublicPage(){if(!isAccountOpen())return <ZipsinCheckApp accountLabel={undefined}/>;const supabase=await createServerSupabaseClient();const{data}=await supabase.auth.getUser();const accountLabel=data.user?.user_metadata?.username??data.user?.email?.split('@')[0];return <ZipsinCheckApp accountLabel={accountLabel}/>;}
