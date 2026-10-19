import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Inspection, InspectionItem, InspectionKind, InspectionReading, InspectionResponse, InspectionRoom, ReadingKind } from '@/features/inspections/domain/inspection';

export type InspectionView = {
  home: { id: string; label: string };
  contractId: string | null;
  /** 사무소 구성원: 만들고 고치고 보낸다(보내기 전까지만). */
  isOfficeEditor: boolean;
  /** 현재 계약의 임대인·임차인: 보낸 뒤 맞아요/의견. */
  partyRole: 'tenant' | 'landlord' | null;
  userId: string;
  inspection: Inspection | null;
  rooms: InspectionRoom[];
  items: InspectionItem[];
  readings: InspectionReading[];
  responses: InspectionResponse[];
};

/* v8 ignore start -- external Supabase boundary is covered by local RLS tests and Preview verification. */
export async function loadInspectionView(supabase: SupabaseClient, userId: string, homeId: string, kind: InspectionKind): Promise<InspectionView | null> {
  const { data: home } = await supabase.from('homes').select('id, home_label, address_line1, address_detail').eq('id', homeId).eq('status', 'active').maybeSingle();
  if (!home) return null;
  const [{ data: contract }, { data: editor }] = await Promise.all([
    supabase.from('contracts').select('id').eq('home_id', homeId).eq('status', 'active').maybeSingle(),
    supabase.rpc('can_access_office_home', { p_home_id: homeId }),
  ]);
  const { data: relation } = contract
    ? await supabase.from('home_memberships').select('relationship_role').eq('home_id', homeId).eq('contract_id', contract.id).eq('user_id', userId).eq('status', 'active').in('relationship_role', ['tenant', 'landlord']).limit(1).maybeSingle()
    : { data: null };
  const base = {
    home: { id: home.id, label: home.home_label ?? [home.address_line1, home.address_detail].filter(Boolean).join(' ') },
    contractId: contract?.id ?? null,
    isOfficeEditor: editor === true,
    partyRole: (relation?.relationship_role as 'tenant' | 'landlord' | undefined) ?? null,
    userId,
  };
  if (!contract) return { ...base, inspection: null, rooms: [], items: [], readings: [], responses: [] };
  const { data: row } = await supabase.from('home_inspections').select('id, home_id, inspection_kind, status, sent_at, created_at').eq('contract_id', contract.id).eq('inspection_kind', kind).maybeSingle();
  if (!row) return { ...base, inspection: null, rooms: [], items: [], readings: [], responses: [] };
  const [rooms, items, readings, responses] = await Promise.all([
    supabase.from('inspection_rooms').select('id, name, sort_order, record_id').eq('inspection_id', row.id).order('sort_order'),
    supabase.from('inspection_items').select('id, room_id, label, aspect, state, note, sort_order').eq('inspection_id', row.id).order('sort_order'),
    supabase.from('inspection_readings').select('reading_kind, value, note').eq('inspection_id', row.id),
    supabase.from('inspection_responses').select('item_id, user_id, relationship_role, response, comment').eq('inspection_id', row.id),
  ]);
  return {
    ...base,
    inspection: { id: row.id, homeId: row.home_id, kind: row.inspection_kind, status: row.status, sentAt: row.sent_at, createdAt: row.created_at },
    rooms: (rooms.data ?? []).map((room) => ({ id: room.id, name: room.name, sortOrder: room.sort_order, recordId: room.record_id })),
    items: (items.data ?? []).map((item) => ({ id: item.id, roomId: item.room_id, label: item.label, aspect: item.aspect, state: item.state, note: item.note, sortOrder: item.sort_order })),
    readings: (readings.data ?? []).map((reading) => ({ kind: reading.reading_kind as ReadingKind, value: reading.value, note: reading.note })),
    responses: (responses.data ?? []).map((response) => ({ itemId: response.item_id, userId: response.user_id, role: response.relationship_role, response: response.response, comment: response.comment })),
  };
}

/** 방 사진: 그 방 사진 기록의 이미지(10분 서명 주소). */
export async function loadRoomPhotos(supabase: SupabaseClient, recordId: string | null) {
  if (!recordId) return [];
  const { data } = await supabase.from('attachments').select('id, storage_path, original_name, media_type, created_at').eq('record_id', recordId).eq('status', 'ready').like('media_type', 'image/%').order('created_at');
  const photos = (data ?? []).filter((photo) => photo.media_type !== 'image/heic');
  if (!photos.length) return [];
  const { data: signed } = await supabase.storage.from('home-records').createSignedUrls(photos.map((photo) => photo.storage_path), 600);
  const urlByPath = new Map((signed ?? []).map((row) => [row.path, row.signedUrl]));
  return photos.map((photo) => ({ id: photo.id, name: photo.original_name, createdAt: photo.created_at, url: urlByPath.get(photo.storage_path) ?? null }));
}
/* v8 ignore stop */
