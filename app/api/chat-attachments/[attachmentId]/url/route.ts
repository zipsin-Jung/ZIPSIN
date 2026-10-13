import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireOnboardingComplete } from '@/features/auth/guards/require-onboarding';

export async function GET(_request: Request, { params }: { params: Promise<{ attachmentId: string }> }) {
  const { attachmentId } = await params;
  if (!z.uuid().safeParse(attachmentId).success) return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  const { supabase } = await requireOnboardingComplete();
  const { data: attachment } = await supabase.from('chat_attachments').select('storage_path').eq('id', attachmentId).eq('status', 'ready').maybeSingle();
  if (!attachment) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(attachment.storage_path, 300);
  if (error || !data) return NextResponse.json({ error: 'server_error' }, { status: 500 });
  return NextResponse.json({ url: data.signedUrl, expiresIn: 300 });
}
