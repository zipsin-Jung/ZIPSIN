import type { UsagePurpose } from './purpose';

export type PrimaryRole =
  | 'principal_broker'
  | 'associate_broker'
  | 'assistant'
  | 'landlord'
  | 'tenant';

export type OnboardingProfile = {
  phoneVerifiedAt: string | null;
  acceptedTermsVersion: string | null;
  acceptedPrivacyVersion: string | null;
  confirmedAgeOver14: boolean;
  usagePurpose: UsagePurpose | null;
  primaryRole: PrimaryRole | null;
};

export function isOnboardingComplete(profile: OnboardingProfile): boolean {
  return Boolean(
    profile.phoneVerifiedAt &&
      profile.acceptedTermsVersion &&
      profile.acceptedPrivacyVersion &&
      profile.confirmedAgeOver14 &&
      profile.usagePurpose &&
      (profile.usagePurpose === 'management_other'
        ? profile.primaryRole === null
        : profile.usagePurpose === 'broker'
          ? ['principal_broker', 'associate_broker', 'assistant'].includes(profile.primaryRole ?? '')
          : profile.primaryRole === profile.usagePurpose),
  );
}
