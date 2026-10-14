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
