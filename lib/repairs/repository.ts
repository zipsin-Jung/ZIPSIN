import 'server-only';
import {randomUUID} from 'node:crypto';
import {getSupabaseServerClient} from '@/lib/supabase/server';
import type {RepairInput, RepairRecord, RepairStatus} from './types';

const TABLE = 'repair_records';
const BUCKET = 'repair-images';
export const RECORDS_PER_PAGE = 6;

export async function listRepairs(options: {page: number; status: RepairStatus | 'all'; query: string}) {
  const client = getSupabaseServerClient();
  const from = (options.page - 1) * RECORDS_PER_PAGE;
  let query = client.from(TABLE).select('*', {count: 'exact'}).order('updated_at', {ascending: false}).range(from, from + RECORDS_PER_PAGE - 1);
  if (options.status !== 'all') query = query.eq('status', options.status);
  if (options.query) query = query.or(`title.ilike.%${escapeFilter(options.query)}%,home_alias.ilike.%${escapeFilter(options.query)}%`);
  const {data, error, count} = await query;
  if (error) throw error;
  return {records: (data ?? []) as RepairRecord[], count: count ?? 0};
}

export async function getRepair(id: string) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) return null;
  const client = getSupabaseServerClient();
  const {data, error} = await client.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const record = data as RepairRecord;
  if (record.image_path) {
    const signed = await client.storage.from(BUCKET).createSignedUrl(record.image_path, 3600);
    if (signed.error) throw signed.error;
    record.image_url = signed.data?.signedUrl ?? null;
  }
  return record;
}

export async function uploadRepairImage(recordId: string, image: File) {
  const client = getSupabaseServerClient();
  const extension = image.type === 'image/png' ? 'png' : image.type === 'image/webp' ? 'webp' : 'jpg';
  const path = `${recordId}/${randomUUID()}.${extension}`;
  const {error} = await client.storage.from(BUCKET).upload(path, await image.arrayBuffer(), {contentType: image.type, upsert: false});
  if (error) throw error;
  return path;
}

export async function removeRepairImage(path: string | null) {
  if (!path) return;
  const {error} = await getSupabaseServerClient().storage.from(BUCKET).remove([path]);
  if (error) throw error;
}

export async function createRepair(input: RepairInput, image: File | null) {
  const client = getSupabaseServerClient();
  const id = randomUUID();
  let imagePath: string | null = null;
  try {
    if (image) imagePath = await uploadRepairImage(id, image);
    const {data, error} = await client.from(TABLE).insert({id, ...input, image_path: imagePath}).select('*').single();
    if (error) throw error;
    return data as RepairRecord;
  } catch (error) {
    if (imagePath) await removeRepairImage(imagePath).catch(console.error);
    throw error;
  }
}

export async function updateRepair(id: string, input: RepairInput, image: File | null, removeImage: boolean) {
  const current = await getRepair(id);
  if (!current) return null;
  let nextPath = current.image_path;
  let uploadedPath: string | null = null;
  let updatedRecord: RepairRecord;
  try {
    if (image) { uploadedPath = await uploadRepairImage(id, image); nextPath = uploadedPath; }
    else if (removeImage) nextPath = null;
    const {data, error} = await getSupabaseServerClient().from(TABLE).update({...input, image_path: nextPath}).eq('id', id).select('*').single();
    if (error) throw error;
    updatedRecord = data as RepairRecord;
  } catch (error) {
    if (uploadedPath) await removeRepairImage(uploadedPath).catch(console.error);
    throw error;
  }
  let cleanupWarning = false;
  if (current.image_path && current.image_path !== nextPath) {
    try { await removeRepairImage(current.image_path); }
    catch (cleanupError) { console.error(cleanupError); cleanupWarning = true; }
  }
  return {record: updatedRecord, cleanupWarning};
}

export async function deleteRepair(id: string) {
  const current = await getRepair(id);
  if (!current) return {deleted: false, cleanupWarning: false};
  const {error} = await getSupabaseServerClient().from(TABLE).delete().eq('id', id);
  if (error) throw error;
  let cleanupWarning = false;
  if (current.image_path) {
    try { await removeRepairImage(current.image_path); }
    catch (cleanupError) { console.error(cleanupError); cleanupWarning = true; }
  }
  return {deleted: true, cleanupWarning};
}

function escapeFilter(value: string) { return value.replace(/[%_,()]/g, ''); }
