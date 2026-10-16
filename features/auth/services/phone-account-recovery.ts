import { maskPhone } from '@/features/auth/schemas/verification';
import { normalizePersonName } from '@/features/auth/domain/mask';

type StartRepository = {
  /** 인증된 휴대폰 번호로 가입한 계정과 가입 때 적은 이름을 돌려준다. */
  findAccountByPhone(phoneE164: string): Promise<{ userId: string; name: string | null; username: string | null } | null>;
  sendOtp(input: { to: string; code: string; expiresInMinutes: number }): Promise<{ providerMessageId: string }>;
  saveChallenge(input: { challengeId: string; phoneE164: string; userId: string | null; digest: string; expiresAt: string; providerMessageId: string }): Promise<void>;
};

/**
 * 비밀번호 재설정: 아이디 + 이름 + 휴대폰 문자 인증 (2026-10-16 사용자 결정).
 * 휴대폰 번호 하나에는 계정 하나만 가입된다(finalize_verified_password_signup의 phone_already_registered).
 * 세 가지가 모두 맞는 계정이 없으면 문자를 보내지 않는다(모르는 사람 번호로 문자 낭비·스팸 방지).
 */
export async function startPhoneAccountRecovery(
  repository: StartRepository,
  input: { username: string; name: string; phoneE164: string },
  challenge: { code: string; challengeId: string; digest: string; expiresAt: string },
) {
  const wanted = normalizePersonName(input.name);
  const wantedUsername = input.username.trim().toLowerCase();
  if (wanted.length < 1 || wantedUsername.length < 1) return { ok: false as const, error: 'not_found' as const };
  const account = await repository.findAccountByPhone(input.phoneE164);
  if (!account || !account.name || !account.username
    || normalizePersonName(account.name) !== wanted
    || account.username.trim().toLowerCase() !== wantedUsername) {
    return { ok: false as const, error: 'not_found' as const };
  }
  const sent = await repository.sendOtp({ to: input.phoneE164, code: challenge.code, expiresInMinutes: 5 });
  await repository.saveChallenge({
    challengeId: challenge.challengeId,
    phoneE164: input.phoneE164,
    userId: account.userId,
    digest: challenge.digest,
    expiresAt: challenge.expiresAt,
    providerMessageId: sent.providerMessageId,
  });
  return { ok: true as const, challengeId: challenge.challengeId, maskedPhone: maskPhone(input.phoneE164) };
}

type VerifyRepository = {
  verifyChallenge(challengeId: string, code: string): Promise<
    | { status: 'verified'; username: string | null }
    | { status: 'expired' | 'used' | 'mismatch' | 'not_found' | 'attempts_exceeded' }
  >;
};

export async function verifyPhoneAccountRecovery(repository: VerifyRepository, challengeId: string, code: string) {
  const result = await repository.verifyChallenge(challengeId, code);
  if (result.status !== 'verified') return { ok: false as const, error: result.status };
  return { ok: true as const, username: result.username };
}
