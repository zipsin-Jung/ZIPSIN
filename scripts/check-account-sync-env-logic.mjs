const REQUIRED = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];

export function validateAccountSyncEnv(env) {
  const errors = [];
  const missing = REQUIRED.filter((name) => !env[name]);

  if (missing.length) errors.push(`누락 환경값: ${missing.join(', ')}`);

  if (env.NODE_ENV === 'production') {
    if (env.AUTH_TEST_MODE === 'true') errors.push('Production AUTH_TEST_MODE 금지');
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
