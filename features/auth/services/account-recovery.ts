import 'server-only';

export type AccountRecoveryRepository = {
  allowAttempt(email: string): Promise<boolean>;
  sendRecoveryEmail(email: string): Promise<void>;
};

export async function requestAccountRecovery(
  repository: AccountRecoveryRepository,
  emailValue: string,
): Promise<{ ok: true }> {
  const email = emailValue.trim().toLowerCase();
  if (!await repository.allowAttempt(email)) return { ok: true };
  try {
    await repository.sendRecoveryEmail(email);
  } catch {
    // Account existence and identity type are deliberately private.
  }
  return { ok: true };
}
