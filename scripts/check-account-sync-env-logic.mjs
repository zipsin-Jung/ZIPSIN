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
    // 이 값이 없으면 운영 로그인이 모두 '잠시 사용할 수 없음'으로 끝난다.
    if (env.PASSWORD_LOGIN_ENABLED !== 'true') errors.push('Production PASSWORD_LOGIN_ENABLED=true 필요(없으면 로그인 전체 불가)');
    // 로그인·가입·문자 인증의 서버 작업에 쓰인다.
    if (!env.SUPABASE_SERVICE_ROLE_KEY) errors.push('Production SUPABASE_SERVICE_ROLE_KEY 누락');
    // 가입 문자 인증은 실제 문자 발송 업체로만 보낸다.
    if (env.PHONE_VERIFICATION_PROVIDER !== 'solapi') errors.push('Production PHONE_VERIFICATION_PROVIDER=solapi 필요(없으면 가입 문자 발송 불가)');
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

    const checkSiteUrl = env.NEXT_PUBLIC_CHECK_SITE_URL;
    if (checkSiteUrl) {
      let checkOrigin = '';
      try { checkOrigin = new URL(checkSiteUrl).origin; } catch { checkOrigin = ''; }
      if (checkOrigin !== 'https://ck.zipsin.net') {
        errors.push('Production NEXT_PUBLIC_CHECK_SITE_URL은 https://ck.zipsin.net이어야 합니다.');
      }
    }
  }

  return errors;
}
