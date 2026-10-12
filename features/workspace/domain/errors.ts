const messages = {
  authentication_required: '로그인 후 다시 시도해 주세요.',
  permission_denied: '이 작업을 수행할 권한이 없습니다.',
  relation_ended: '접근 관계가 종료되었습니다.',
  invitation_expired: '초대가 만료되었습니다. 새 초대를 요청해 주세요.',
  invitation_revoked: '초대가 철회되었습니다.',
  invitation_used: '이미 사용한 초대입니다.',
  invalid_input: '입력한 내용을 확인해 주세요.',
  conflict: '이미 처리된 요청입니다. 현재 상태를 확인해 주세요.',
  server_error: '처리하지 못했습니다. 잠시 후 다시 시도해 주세요.',
} as const;

export type WorkspaceErrorCode = keyof typeof messages;

/** Never return database messages, details, identifiers, or constraint names to the client. */
export function toWorkspaceErrorCode(error: unknown): WorkspaceErrorCode {
  if (!error || typeof error !== 'object') return 'server_error';
  const { message, code } = error as { message?: unknown; code?: unknown };
  if (typeof message === 'string' && Object.hasOwn(messages, message)) return message as WorkspaceErrorCode;
  if (code === '23505') return 'conflict';
  if (code === '23503' || code === '23514' || code === '22P02') return 'invalid_input';
  if (code === '42501') return 'permission_denied';
  return 'server_error';
}

export function workspaceErrorMessage(code: WorkspaceErrorCode): string {
  return messages[code];
}
