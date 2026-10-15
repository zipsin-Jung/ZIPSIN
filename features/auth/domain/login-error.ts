export type LoginErrorTone = 'danger' | 'warning' | 'info';

export type LoginErrorMessage = {
  title: string;
  body: string;
  tone: LoginErrorTone;
};

const INVALID: LoginErrorMessage = {
  title: '아이디 또는 비밀번호가 맞지 않습니다.',
  body: '입력한 내용을 다시 확인해 주세요. 기억나지 않으면 아이디·비밀번호 찾기를 이용하세요.',
  tone: 'danger',
};

const MESSAGES: Record<string, LoginErrorMessage> = {
  invalid_credentials: INVALID,
  rate_limited: {
    title: '로그인 시도가 너무 많습니다.',
    body: '계정을 보호하기 위해 잠시 막아 두었어요. 1분쯤 뒤에 다시 시도해 주세요.',
    tone: 'warning',
  },
  service_unavailable: {
    title: '지금은 로그인을 처리할 수 없습니다.',
    body: '입력하신 정보의 문제가 아니에요. 잠시 후 다시 시도해 주세요.',
    tone: 'info',
  },
};

/**
 * 로그인 오류 코드를 사용자 문구로 바꾼다.
 * 알 수 없는 코드는 계정 존재 여부를 드러내지 않도록 불일치 문구로 처리한다.
 */
export function getLoginError(code: string | undefined): LoginErrorMessage | null {
  if (!code) return null;
  return MESSAGES[code] ?? INVALID;
}
