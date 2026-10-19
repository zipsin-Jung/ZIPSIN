import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { InspectionOverview, MetersScreen, RoomScreen } from '@/features/inspections/components/InspectionScreens';
import { pairWithMoveIn, type InspectionKind } from '@/features/inspections/domain/inspection';
import { loadInspectionView, loadRoomPhotos } from '@/features/inspections/services/load-inspection';

type Search = Promise<{ error?: string; sent?: string; confirm?: string; aspect?: string; item?: string; saved?: string }>;

function Unavailable() {
  return <main className="mx-auto max-w-xl px-5 py-16"><h1 className="text-xl font-bold">볼 수 없는 기록이에요</h1><p className="mt-2 text-[15px] text-[#4D5159]">권한이 없거나 없는 집이에요.</p></main>;
}

export async function renderOverview(kind: InspectionKind, params: Promise<{ homeId: string }>, searchParams?: Search) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const view = await loadInspectionView(supabase, user.id, homeId, kind);
  if (!view || (!view.isOfficeEditor && !view.partyRole)) return <Unavailable />;
  return <InspectionOverview confirm={query.confirm === '1'} error={query.error} kind={kind} sent={query.sent === '1'} view={view} />;
}

export async function renderRoom(kind: InspectionKind, params: Promise<{ homeId: string; roomId: string }>, searchParams?: Search) {
  const { homeId, roomId } = await params;
  if (!z.uuid().safeParse(homeId).success || !z.uuid().safeParse(roomId).success) return <Unavailable />;
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const view = await loadInspectionView(supabase, user.id, homeId, kind);
  const room = view?.rooms.find((candidate) => candidate.id === roomId);
  if (!view || !room) return <Unavailable />;
  const photos = await loadRoomPhotos(supabase, room.recordId);
  let before;
  if (kind === 'move_out') {
    const moveIn = await loadInspectionView(supabase, user.id, homeId, 'move_in');
    before = pairWithMoveIn(view.items, view.rooms, moveIn?.items ?? [], moveIn?.rooms ?? []);
  }
  return <RoomScreen aspect={query.aspect === 'cleaning' ? 'cleaning' : 'damage'} before={before} beforeLabel="입주 때" error={query.error} errorItem={query.item} kind={kind} photos={photos} roomId={roomId} view={view} />;
}

export async function renderMeters(kind: InspectionKind, params: Promise<{ homeId: string }>, searchParams?: Search) {
  const { homeId } = await params;
  if (!z.uuid().safeParse(homeId).success) return <Unavailable />;
  const query = (await searchParams) ?? {};
  const { supabase, user } = await requireOnboardingComplete();
  const view = await loadInspectionView(supabase, user.id, homeId, kind);
  if (!view?.inspection) return <Unavailable />;
  return <MetersScreen error={query.error} kind={kind} saved={query.saved === '1'} view={view} />;
}
