'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';
import { KIND_PATH, knownErrorCode, type InspectionKind } from '@/features/inspections/domain/inspection';

const uuid = z.uuid();
const kindSchema = z.enum(['move_in', 'move_out']);

function base(homeId: string, kind: InspectionKind) {
  return `/homes/${homeId}/${KIND_PATH[kind]}`;
}

function back(path: string, error?: string | null): never {
  redirect(error ? `${path}${path.includes('?') ? '&' : '?'}error=${knownErrorCode(error)}` : path);
}

function common(formData: FormData) {
  const homeId = String(formData.get('homeId') ?? '');
  const kind = kindSchema.safeParse(formData.get('kind'));
  if (!uuid.safeParse(homeId).success || !kind.success) redirect('/home');
  return { homeId, kind: kind.data };
}

/** 입주/퇴거 기록 만들기: 고른 방 + 직접 적은 방. */
export async function createInspectionAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const rooms = [...formData.getAll('room').map(String), ...String(formData.get('extraRooms') ?? '').split(',')]
    .map((name) => name.trim()).filter(Boolean).slice(0, 15);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('create_home_inspection', { p_home_id: homeId, p_kind: kind, p_rooms: rooms });
  back(base(homeId, kind), error?.message);
}

export async function setItemAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const itemId = String(formData.get('itemId') ?? '');
  const roomId = String(formData.get('roomId') ?? '');
  const aspect = formData.get('aspect') === 'cleaning' ? 'cleaning' : 'damage';
  const state = z.enum(['unchecked', 'ok', 'issue']).safeParse(formData.get('state'));
  if (!uuid.safeParse(itemId).success || !uuid.safeParse(roomId).success || !state.success) redirect('/home');
  const note = String(formData.get('note') ?? '').slice(0, 300);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('set_inspection_item', { p_item_id: itemId, p_state: state.data, p_note: note || null });
  back(`${base(homeId, kind)}/rooms/${roomId}?aspect=${aspect}${error ? `&item=${itemId}` : ''}`, error?.message);
}

export async function addItemAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const roomId = String(formData.get('roomId') ?? '');
  const aspect = formData.get('aspect') === 'cleaning' ? 'cleaning' : 'damage';
  const label = String(formData.get('label') ?? '').trim().slice(0, 40);
  if (!uuid.safeParse(roomId).success || !label) back(`${base(homeId, kind)}/rooms/${roomId}?aspect=${aspect}`);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('add_inspection_item', { p_room_id: roomId, p_label: label, p_aspect: aspect });
  back(`${base(homeId, kind)}/rooms/${roomId}?aspect=${aspect}`, error?.message);
}

export async function addRoomAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const inspectionId = String(formData.get('inspectionId') ?? '');
  const name = String(formData.get('name') ?? '').trim().slice(0, 30);
  if (!uuid.safeParse(inspectionId).success || !name) back(base(homeId, kind));
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('add_inspection_room', { p_inspection_id: inspectionId, p_name: name });
  back(base(homeId, kind), error?.message);
}

export async function saveReadingsAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const inspectionId = String(formData.get('inspectionId') ?? '');
  if (!uuid.safeParse(inspectionId).success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const kinds = ['electric', 'gas', 'water', 'keys', 'card_keys', 'remotes', 'door_code_changed'];
  for (const readingKind of kinds) {
    if (!formData.has(readingKind)) continue;
    const value = String(formData.get(readingKind) ?? '').trim().slice(0, 60);
    const { error } = await supabase.rpc('set_inspection_reading', { p_inspection_id: inspectionId, p_kind: readingKind, p_value: value, p_note: null });
    if (error) back(`${base(homeId, kind)}/meters`, error.message);
  }
  back(`${base(homeId, kind)}/meters?saved=1`);
}

export async function sendInspectionAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const inspectionId = String(formData.get('inspectionId') ?? '');
  if (!uuid.safeParse(inspectionId).success || formData.get('confirm') !== 'on') back(`${base(homeId, kind)}?confirm=1`);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('send_home_inspection', { p_inspection_id: inspectionId });
  back(`${base(homeId, kind)}${error ? '' : '?sent=1'}`, error?.message);
}

export async function respondAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const itemId = String(formData.get('itemId') ?? '');
  const roomId = String(formData.get('roomId') ?? '');
  const aspect = formData.get('aspect') === 'cleaning' ? 'cleaning' : 'damage';
  const response = z.enum(['agree', 'comment']).safeParse(formData.get('response'));
  if (!uuid.safeParse(itemId).success || !uuid.safeParse(roomId).success || !response.success) redirect('/home');
  const comment = String(formData.get('comment') ?? '').slice(0, 300);
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('respond_inspection_item', { p_item_id: itemId, p_response: response.data, p_comment: comment || null });
  back(`${base(homeId, kind)}/rooms/${roomId}?aspect=${aspect}${error ? `&item=${itemId}` : ''}`, error?.message);
}

/** 방 사진을 올릴 기록을 만든 뒤 그 방 화면으로 돌아간다. */
export async function ensureRoomRecordAction(formData: FormData) {
  const { homeId, kind } = common(formData);
  const roomId = String(formData.get('roomId') ?? '');
  if (!uuid.safeParse(roomId).success) redirect('/home');
  const { supabase } = await requireOnboardingComplete();
  const { error } = await supabase.rpc('ensure_inspection_room_record', { p_room_id: roomId });
  back(`${base(homeId, kind)}/rooms/${roomId}?photos=1`, error?.message);
}
