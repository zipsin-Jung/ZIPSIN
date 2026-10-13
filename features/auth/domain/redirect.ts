const DEFAULT_NEXT_PATH = '/home';

export function sanitizeNextPath(value: string | null | undefined): string {
  if (
    !value?.startsWith('/')
    || value.startsWith('//')
    || value.includes('\\')
    || /%5c/i.test(value)
    || /(^|\/)\.\.?(\/|$)/.test(value.split('?')[0])
    || /%2f/i.test(value)
  ) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}
