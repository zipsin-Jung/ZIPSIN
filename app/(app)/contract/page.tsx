import { Camera, FileSignature, FileText, FolderOpen, Home, KeyRound, ListChecks, PenLine, Stamp, Wallet } from 'lucide-react';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { HomeSwitch, LifecyclePage, type ActionCard } from '@/features/lifecycle/LifecyclePage';
import { loadHomePhotoStrip, loadInspectionStatus, loadMyChecks } from '@/features/lifecycle/load';
import { loadSpaceHomes } from '@/features/workspace/services/space-homes';

type Props = { searchParams?: Promise<{ home?: string }> };

/** 계약 · 입주 (대표 Figma "계약.입주"). */
export default async function ContractPage({ searchParams }: Props) {
  const { home: homeParam } = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const space = await loadSpaceHomes(supabase, user.id, homeParam);
  const home = space.ok ? space.selected : null;
  const [checks, inspection, photos] = home
    ? await Promise.all([loadMyChecks(supabase, user.id, home.id), loadInspectionStatus(supabase, home.id), loadHomePhotoStrip(supabase, home.id)])
    : [new Set<string>(), { moveIn: null, moveOut: null }, []];
  const recordNew = home ? `/homes/${home.id}/records/new` : null;
  const cards: ActionCard[] = [
    { title: '계약서 등록', body: '계약서 사진 또는 PDF를 등록하고 안전하게 보관하세요.', icon: FileSignature, button: '등록하기', buttonIcon: Camera, href: recordNew },
    { title: '특약사항 기록', body: '특약사항을 정리하고 중요 내용을 메모하세요.', icon: ListChecks, button: '기록하기', buttonIcon: PenLine, href: home ? `${recordNew}?kind=note` : null },
    { title: '보증금·월세 정보', body: '보증금, 월세, 관리비 등 금액 정보를 기록하세요.', icon: Wallet, button: '기록하기', buttonIcon: PenLine, href: home ? `${recordNew}?kind=note` : null },
    { title: '관련 서류', body: '등기부등본, 신분증 사본, 영수증 등을 보관하세요.', icon: FolderOpen, button: '추가하기', buttonIcon: FolderOpen, href: recordNew },
  ];
  return (
    <LifecyclePage
      addHref={recordNew}
      cards={cards}
      homeSwitch={space.ok ? <HomeSwitch basePath="/contract" homes={space.homes} selectedId={home?.id ?? null} /> : null}
      lead="계약부터 입주까지, 중요한 순간을 기록하고 관리하세요."
      noHome={home ? null : <p className="mt-4 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] text-[#4D5159]">집이 연결되면 기록할 수 있어요. 중개사무소에서 보낸 초대 링크를 열어 주세요.</p>}
      note="한 번의 기록이 권리를 지킵니다."
      photos={photos}
      photosHref={home ? `/homes/${home.id}?tab=photos` : null}
      photosLead="계약 관련 사진을 등록하세요."
      photosTitle="사진 기록"
      sectionLead="계약서와 관련 서류를 등록하고 보관하세요."
      sectionTitle="계약 체결"
      steps={[
        { label: '계약 체결', icon: FileText, done: Boolean(home?.endsOn) },
        { label: '확정일자', icon: Stamp, done: checks.has('before_move_in:fixed_date') },
        { label: '전입신고', icon: Home, done: checks.has('after_move_in:move_in_report_done') },
        { label: '입주 전 사진', icon: Camera, done: Boolean(inspection.moveIn) },
        { label: '입주 완료', icon: KeyRound, done: inspection.moveIn === 'sent' },
      ]}
      title="계약 · 입주"
    />
  );
}
