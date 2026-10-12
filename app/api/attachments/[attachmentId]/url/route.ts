import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(_: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params; if (!z.uuid().safeParse(attachmentId).success) return NextResponse.json({ error: '파일을 확인할 수 없습니다.' }, { status: 404 });
  const supabase = await createServerSupabaseClient();
  const { data: attachment } = await supabase.from('attachments').select('storage_path').eq('id', attachmentId).eq('status', 'ready').maybeSingle();
  if (!attachment) return NextResponse.json({ error: '파일을 확인할 수 없습니다.' }, { status: 404 });
  const { data, error } = await supabase.storage.from('home-records').createSignedUrl(attachment.storage_path, 300);
  if (error || !data) return NextResponse.json({ error: '파일을 열지 못했습니다.' }, { status: 403 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}
