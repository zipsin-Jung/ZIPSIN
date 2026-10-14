const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

export function validateAccountSyncEnv(env) {
  const errors = [];
  const missing = REQUIRED.filter((name) => !env[name]);

  if (missing.length) errors.push(`누락 환경값: ${missing.join(', ')}`);

  if (env.PHONE_VERIFICATION_PROVIDER === 'solapi') {
    const solapiRequired = ['SOLAPI_API_KEY', 'SOLAPI_API_SECRET', 'SOLAPI_SENDER_NUMBER', 'PHONE_OTP_HMAC_SECRET'];
    const solapiMissing = solapiRequired.filter((name) => !env[name]);
    if (solapiMissing.length) errors.push(`SOLAPI 설정 누락: ${solapiMissing.join(', ')}`);
  }

  if (env.NODE_ENV === 'production') {
    if (env.AUTH_TEST_MODE === 'true') errors.push('Production AUTH_TEST_MODE 금지');
    if (env.PHONE_VERIFICATION_PROVIDER === 'mock') errors.push('Production PHONE_VERIFICATION_PROVIDER=mock 금지');
    if (env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN !== '.zipsin.net') {
      errors.push('Production NEXT_PUBLIC_AUTH_COOKIE_DOMAIN은 .zipsin.net이어야 합니다.');
    }

    const siteUrl = env.NEXT_PUBLIC_SITE_URL;
    if (!siteUrl) {
      errors.push('Production NEXT_PUBLIC_SITE_URL 누락');
    } else {
      try {
        const url = new URL(siteUrl);
        if (url.origin !== 'https://zipsin.net') {
          errors.push('Production NEXT_PUBLIC_SITE_URL은 https://zipsin.net이어야 합니다.');
        }
      } catch {
        errors.push('Production NEXT_PUBLIC_SITE_URL 형식 오류');
      }
    }
  }

  return errors;
}
