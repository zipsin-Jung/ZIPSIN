export type InstallMode = 'prompt-ready' | 'ios-guide' | 'generic-guide' | 'installed';

type InstallModeInput = {
  promptAvailable: boolean;
  ios: boolean;
  standalone: boolean;
};

type NavigatorLike = {
  userAgent?: string;
  platform?: string;
  maxTouchPoints?: number;
};

export function resolveInstallMode({
  promptAvailable,
  ios,
  standalone,
}: InstallModeInput): InstallMode {
  if (standalone) return 'installed';
  if (promptAvailable) return 'prompt-ready';
  if (ios) return 'ios-guide';
  return 'generic-guide';
}

export function isIosLike(navigatorLike: NavigatorLike): boolean {
  const userAgent = navigatorLike.userAgent ?? '';
  const platform = navigatorLike.platform ?? '';
  const touchPoints = navigatorLike.maxTouchPoints ?? 0;

  return /iPad|iPhone|iPod/i.test(userAgent)
    || /iPad|iPhone|iPod/i.test(platform)
    || (platform === 'MacIntel' && touchPoints > 1);
}

/** 휴대폰·태블릿이면 true. PC에서는 설치 안내 대신 휴대폰으로 찍을 QR을 먼저 보여 준다. */
export function isMobileLike(navigatorLike: NavigatorLike): boolean {
  return isIosLike(navigatorLike) || /Android|Mobile|iPhone|iPad|iPod/i.test(navigatorLike.userAgent ?? '');
}

/** QR이 여는 주소. 휴대폰에서 이 주소로 들어오면 설치 안내가 자동으로 열린다. */
export const INSTALL_QUERY = 'install';
export function installLandingUrl(origin: string): string {
  return `${origin.replace(/\/$/, '')}/?${INSTALL_QUERY}=1`;
}

export function hasInstallQuery(search: string): boolean {
  return new URLSearchParams(search).get(INSTALL_QUERY) === '1';
}
