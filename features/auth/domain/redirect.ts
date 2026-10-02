const DEFAULT_NEXT_PATH = '/home';

export function sanitizeNextPath(value: string | null | undefined): string {
  if (!value?.startsWith('/') || value.startsWith('//')) {
    return DEFAULT_NEXT_PATH;
  }

  return value;
}
