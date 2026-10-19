const messages: Record<string, string> = {
  login_required: '로그인한 뒤 다시 해 주세요.',
  phone_required: '휴대전화 인증을 마친 뒤 예약할 수 있어요.',
  permission_denied: '이 작업을 할 수 있는 계정이 아니에요.',
  not_found: '찾을 수 없어요. 화면을 새로 고쳐 주세요.',
  invalid_state: '이미 다른 단계로 넘어갔어요. 화면을 새로 고쳐 주세요.',
  invalid_input: '입력한 내용을 확인해 주세요.',
  partner_unavailable: '지금은 이 업체를 고를 수 없어요. 다른 업체를 골라 주세요.',
  after_photo_required: '완료 사진을 1장 이상 올려 주세요.',
  invite_invalid: '초대 코드가 맞지 않거나 이미 쓰였거나 기간이 지났어요.',
  too_many_photos: '사진은 30장까지 올릴 수 있어요.',
  upload_missing: '사진이 다 올라가지 않았어요. 다시 올려 주세요.',
  server_error: '처리하지 못했어요. 잠시 뒤 다시 해 주세요.',
};

/** DB 원문 메시지는 화면에 내보내지 않는다. */
export function cleanErrorMessage(error: unknown): string {
  if (error && typeof error === 'object') {
    const { message, code } = error as { message?: unknown; code?: unknown };
    if (typeof message === 'string' && Object.hasOwn(messages, message)) return messages[message];
    if (code === '42501') return messages.permission_denied;
    if (code === '23514' || code === '22P02' || code === '23503') return messages.invalid_input;
  }
  return messages.server_error;
}
export const cleanMessage = (key: keyof typeof messages | string) => messages[key] ?? messages.server_error;
