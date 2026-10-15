import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/features/auth/actions/login-with-username', () => ({
  loginWithUsernameAction: vi.fn(() => new Promise(() => {})),
}));
vi.mock('@/features/auth/actions/start-oauth', () => ({ startOAuth: vi.fn() }));

import LoginPage from '@/app/(auth)/login/page';
import { UsernameLoginForm } from '@/features/auth/components/UsernameLoginForm';
import { getLoginError } from '@/features/auth/domain/login-error';

async function renderLogin(params: { error?: string; next?: string } = {}) {
  render(await LoginPage({ searchParams: Promise.resolve(params) }));
}

afterEach(() => {
  vi.unstubAllEnvs();
  window.sessionStorage.clear();
});

describe('LOGIN-UX-001 중앙 카드 로그인', () => {
  it('TEST-LOGIN-001 제목·보조 문장·보호 안내·찾기·회원가입 링크를 보여준다', async () => {
    await renderLogin();

    expect(screen.getByRole('heading', { level: 1, name: '집신 로그인' })).toBeInTheDocument();
    expect(screen.getByText('집과 사무소의 기록을 이어서 확인하세요.')).toBeInTheDocument();
    expect(screen.getByText('집신은 권한 없이 집의 기록을 공개하지 않습니다.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '아이디·비밀번호 찾기' })).toHaveAttribute('href', '/account-recovery');
    expect(screen.getByRole('link', { name: '회원가입' })).toHaveAttribute('href', '/signup');
    expect(screen.queryByText(/안전하게 보호합니다/)).not.toBeInTheDocument();
  });

  it('TEST-LOGIN-002 연결된 소셜 제공자가 없으면 간편 로그인 영역과 구분선을 숨긴다', async () => {
    await renderLogin();

    expect(screen.queryByRole('group', { name: '간편 로그인' })).not.toBeInTheDocument();
    expect(screen.queryByText('또는 아이디로 로그인')).not.toBeInTheDocument();
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /카카오|네이버|Google/ })).not.toBeInTheDocument();
  });

  it('TEST-LOGIN-003 연결된 제공자만 버튼으로 보여주고 구분선을 표시한다', async () => {
    vi.stubEnv('NEXT_PUBLIC_AUTH_KAKAO_ENABLED', 'true');
    await renderLogin();

    const group = screen.getByRole('group', { name: '간편 로그인' });
    expect(within(group).getByRole('button', { name: '카카오로 계속하기' })).toBeEnabled();
    expect(within(group).queryByRole('button', { name: /네이버|Google/ })).not.toBeInTheDocument();
    expect(screen.getByText('또는 아이디로 로그인')).toBeInTheDocument();
  });

  it('TEST-LOGIN-004 오류가 없으면 경고를 보여주지 않는다', async () => {
    await renderLogin();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it.each([
    ['invalid_credentials', '아이디 또는 비밀번호가 맞지 않습니다.'],
    ['rate_limited', '로그인 시도가 너무 많습니다.'],
    ['service_unavailable', '지금은 로그인을 처리할 수 없습니다.'],
    ['unknown_code', '아이디 또는 비밀번호가 맞지 않습니다.'],
  ])('TEST-LOGIN-005 오류 코드 %s 를 구분된 문구로 보여준다', async (code, title) => {
    await renderLogin({ error: code });
    expect(within(screen.getByRole('alert')).getByText(title)).toBeInTheDocument();
  });
});

describe('LOGIN-UX-002 오류 문구 규칙', () => {
  it('TEST-LOGIN-006 불일치 문구는 아이디와 비밀번호 중 무엇이 틀렸는지 밝히지 않는다', () => {
    const message = getLoginError('invalid_credentials');
    expect(message?.body).not.toMatch(/존재하지|없는 아이디|비밀번호만/);
    expect(message?.tone).toBe('danger');
  });

  it('TEST-LOGIN-007 시도 초과와 서비스 오류는 서로 다른 안내와 톤을 쓴다', () => {
    expect(getLoginError('rate_limited')?.tone).toBe('warning');
    expect(getLoginError('service_unavailable')?.body).toContain('입력하신 정보의 문제가 아니에요');
    expect(getLoginError('service_unavailable')?.tone).toBe('info');
  });

  it('TEST-LOGIN-008 오류 코드가 없으면 null 을 돌려준다', () => {
    expect(getLoginError(undefined)).toBeNull();
    expect(getLoginError('')).toBeNull();
  });
});

describe('LOGIN-UX-004 간편 로그인 실행', () => {
  it('TEST-LOGIN-013 연결된 제공자를 누르면 OAuth를 시작하고 중복 클릭을 막는다', async () => {
    const { startOAuth } = await import('@/features/auth/actions/start-oauth');
    vi.mocked(startOAuth).mockImplementation(() => new Promise(() => {}));
    const { SocialLoginButtons } = await import('@/features/auth/components/SocialLoginButtons');
    const user = userEvent.setup();
    render(<SocialLoginButtons enabledProviders={['kakao']} next="/homes" />);

    await user.click(screen.getByRole('button', { name: '카카오로 계속하기' }));

    expect(startOAuth).toHaveBeenCalledWith('kakao', '/homes');
    expect(await screen.findByRole('status')).toHaveTextContent('로그인 화면으로 이동하고 있습니다.');
    expect(screen.getByRole('button', { name: '카카오로 계속하기' })).toBeDisabled();
  });
});

describe('LOGIN-UX-003 로그인 폼', () => {
  it('TEST-LOGIN-009 제출 중에는 버튼을 잠그고 처리 중 문구를 보여준다', async () => {
    const user = userEvent.setup();
    render(<UsernameLoginForm />);

    await user.type(screen.getByLabelText('아이디'), 'zipsin_agent');
    await user.type(screen.getByLabelText('비밀번호'), 'correct-horse-1');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    const pending = await screen.findByRole('button', { name: '로그인하고 있어요…' });
    expect(pending).toBeDisabled();
  });

  it('TEST-LOGIN-010 오류 뒤 다시 열면 아이디는 남기고 비밀번호는 비운다', () => {
    window.sessionStorage.setItem('zipsin:last-login-username', 'zipsin_agent');
    render(<UsernameLoginForm hasError />);

    expect(screen.getByLabelText('아이디')).toHaveValue('zipsin_agent');
    expect(screen.getByLabelText('비밀번호')).toHaveValue('');
    expect(screen.getByLabelText('비밀번호')).toHaveFocus();
  });

  it('TEST-LOGIN-011 오류가 없으면 저장된 아이디를 채우지 않는다', () => {
    window.sessionStorage.setItem('zipsin:last-login-username', 'zipsin_agent');
    render(<UsernameLoginForm />);
    expect(screen.getByLabelText('아이디')).toHaveValue('');
  });

  it('TEST-LOGIN-012 브라우저 저장소를 쓸 수 없어도 폼은 동작한다', () => {
    const spy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    render(<UsernameLoginForm hasError />);
    expect(screen.getByLabelText('아이디')).toHaveValue('');
    spy.mockRestore();
  });
});
