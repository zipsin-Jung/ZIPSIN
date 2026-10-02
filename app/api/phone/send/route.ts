import { NextResponse, type NextRequest } from 'next/server';
import { normalizeKoreanMobile, maskPhone } from '@/features/auth/schemas/verification';
import { getPhoneVerificationProvider } from '@/features/auth/phone/runtime-provider';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  try {
    const { phone } = (await request.json()) as { phone?: string };
    const phoneE164 = normalizeKoreanMobile(phone ?? '');
    const provider = getPhoneVerificationProvider();
    const challenge = await provider.sendCode(phoneE164, data.user.id);
    return NextResponse.json({
      challengeId: challenge.id,
      expiresAt: challenge.expiresAt,
      maskedPhone: maskPhone(phoneE164),
      developmentCode: process.env.NODE_ENV === 'development' ? challenge.developmentCode : undefined,
    });
  } catch (error) {
    const unavailable = error instanceof Error && error.message.includes('공급자');
    return NextResponse.json(
      { error: unavailable ? 'provider_unavailable' : 'invalid_phone' },
      { status: unavailable ? 503 : 400 },
    );
  }
}
