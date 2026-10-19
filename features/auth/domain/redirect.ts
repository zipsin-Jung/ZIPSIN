const DEFAULT_NEXT_PATH = '/home';
const ALLOWED_PATHS = [
  '/home', '/ck', '/my', '/homes', '/chats', '/tasks', '/support',
  '/office', '/invitations', '/onboarding', '/signup/verify', '/reset-password', '/cl',
];

export function sanitizeNextPath(value: string | null | undefined): string {
  const pathname = value?.split('?')[0];
  if (
    !value?.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || /%5c/i.test(value)
    || /(^|\/)\.\.?(\/|$)/.test(value.split('?')[0])
    || /%2f/i.test(value)
    || !pathname
    || !ALLOWED_PATHS.some((allowed) => pathname === allowed || pathname.startsWith(`${allowed}/`))
  ) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}
