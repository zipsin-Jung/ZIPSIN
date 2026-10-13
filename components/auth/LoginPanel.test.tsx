import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import LoginPanel from './LoginPanel';

afterEach(cleanup);

describe('집신 단일 로그인', () => {
  it('설정된 공급자만 시작할 수 있다', () => {
    const onStart = vi.fn();
    render(<LoginPanel states={[
      {provider: 'google', available: true},
      {provider: 'kakao', available: false, reason: 'not-configured'},
      {provider: 'naver', available: false, reason: 'not-configured'},
    ]} onStart={onStart} onLater={vi.fn()}/>);

    fireEvent.click(screen.getByRole('button', {name: 'Google로 계속'}));
    expect(onStart).toHaveBeenCalledWith('google');
    expect(screen.getByRole('button', {name: /Kakao.*준비 중/})).toBeDisabled();
    expect(screen.getByRole('button', {name: /Naver.*준비 중/})).toBeDisabled();
  });

  it('나중에를 숨기지 않는다', () => {
    const onLater = vi.fn();
    render(<LoginPanel states={[]} onStart={vi.fn()} onLater={onLater}/>);
    fireEvent.click(screen.getByRole('button', {name: '나중에'}));
    expect(onLater).toHaveBeenCalledOnce();
  });
});
