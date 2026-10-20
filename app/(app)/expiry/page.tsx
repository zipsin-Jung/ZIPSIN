import { CalendarCheck, CalendarDays, ClipboardCheck, FolderOpen, Home, PackageOpen, PenLine, Search, Wallet } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { HomeSwitch, LifecyclePage, type ActionCard } from '@/features/lifecycle/LifecyclePage';
import { loadHomePhotoStrip, loadInspectionStatus, loadMyChecks } from '@/features/lifecycle/load';
import { loadSpaceHomes } from '@/features/workspace/services/space-homes';

type Props = { searchParams?: Promise<{ home?: string }> };

/** 만기 · 퇴거 (대표 Figma "만기.퇴거"). 보증금은 기록만 한다(집신은 돈을 맡지 않는다). */
export default async function ExpiryPage({ searchParams }: Props) {
  const { home: homeParam } = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const space = await loadSpaceHomes(supabase, user.id, homeParam);
  const home = space.ok ? space.selected : null;
  const [checks, inspection, photos] = home
    ? await Promise.all([loadMyChecks(supabase, user.id, home.id), loadInspectionStatus(supabase, home.id), loadHomePhotoStrip(supabase, home.id, '퇴거')])
    : [new Set<string>(), { moveIn: null, moveOut: null }, []];
  const recordNew = home ? `/homes/${home.id}/records/new` : null;
  const cards: ActionCard[] = [
    { title: '계약 만료 확인', body: home?.contractDay ? `계약 만료 ${home.contractDay.label}. 연장 여부를 미리 정하세요.` : '계약 만료일과 연장 여부를 미리 확인하세요.', icon: CalendarDays, button: '확인하기', buttonIcon: CalendarDays, href: home ? `/homes/${home.id}` : null },
    { title: '퇴거 사전 점검', body: '입주 때 기록과 나란히 보며 집 상태를 점검하세요.', icon: ClipboardCheck, button: '점검하기', buttonIcon: Search, href: home ? `/homes/${home.id}/move-out` : null },
    { title: '보증금 정산', body: '관리비, 공과금 정산과 보증금 받은 날을 기록하세요.', icon: Wallet, button: '기록하기', buttonIcon: PenLine, href: home ? `${recordNew}?kind=note` : null },
    { title: '관련 서류', body: '필요한 서류를 챙겨 안전하게 보관하세요.', icon: FolderOpen, button: '추가하기', buttonIcon: FolderOpen, href: recordNew },
  ];
  return (
    <LifecyclePage
      addHref={recordNew}
      cards={cards}
      homeSwitch={space.ok ? <HomeSwitch basePath="/expiry" homes={space.homes} selectedId={home?.id ?? null} /> : null}
      lead="계약 만료부터 퇴거까지, 놓치기 쉬운 항목을 확인하고 마무리하세요."
      noHome={home ? null : <p className="mt-4 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] text-[#4D5159]">먼저 집을 추가하면 기록할 수 있어요. <a className="font-semibold text-[#0B6655] underline underline-offset-4" href="/homes/new?mine=1">집 추가하기</a></p>}
      note="한 번의 기록이 권리를 지킵니다."
      photos={photos}
      photosHref={home ? `/homes/${home.id}/move-out` : null}
      photosLead="퇴거 전후 사진을 등록하세요."
      photosTitle="사진 기록"
      sectionLead="꼼꼼히 확인하고 깔끔하게 마무리하세요."
      sectionTitle="퇴거 체크리스트"
      steps={[
        { label: '만기 확인', icon: CalendarCheck, done: Boolean(home?.endsOn) },
        { label: '퇴거 준비', icon: ClipboardCheck, done: checks.has('before_expiry:decide') },
        { label: '점검 · 정산', icon: Search, done: Boolean(inspection.moveOut) },
        { label: '짐 정리 · 반출', icon: PackageOpen, done: checks.has('move_out:keys_return') },
        { label: '퇴거 완료', icon: Home, done: inspection.moveOut === 'sent' },
      ]}
      title="만기 · 퇴거"
    />
  );
}
