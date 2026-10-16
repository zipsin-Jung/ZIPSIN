type DeviceHints = { userAgent: string; coarsePointer: boolean };

/** Phones and tablets get the "add to home screen" guide; computers get the QR code. */
export function isPhoneLike({ userAgent, coarsePointer }: DeviceHints): boolean {
  if (/iPhone|iPod|iPad|Android/i.test(userAgent)) return true;
  // iPadOS Safari reports a Mac user agent; a touch-first Mac is an iPad.
  return coarsePointer && /Macintosh/i.test(userAgent);
}

export const INSTALL_QUERY = 'install';

/** Address the QR code opens: the same site the visitor is on, with the install guide open. */
export function buildInstallUrl(origin: string, path: string): string {
  return `${origin}${path}?${INSTALL_QUERY}=1`;
}

export function readInstallRequest(search: string): boolean {
  return new URLSearchParams(search).get(INSTALL_QUERY) === '1';
}
