export type PrimaryRole =
  | 'principal_broker'
  | 'assistant'
  | 'landlord'
  | 'tenant';

export type OnboardingProfile = {
  phoneVerifiedAt: string | null;
  acceptedTermsVersion: string | null;
  acceptedPrivacyVersion: string | null;
  confirmedAgeOver14: boolean;
  primaryRole: PrimaryRole | null;
};

export function isOnboardingComplete(profile: OnboardingProfile): boolean {
  return Boolean(
    profile.phoneVerifiedAt &&
      profile.acceptedTermsVersion &&
      profile.acceptedPrivacyVersion &&
      profile.confirmedAgeOver14 &&
      profile.primaryRole,
  );
}
