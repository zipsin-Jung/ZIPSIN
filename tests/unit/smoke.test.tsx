import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LandingPage from '@/components/LandingPage';

describe('기존 랜딩페이지', () => {
  it('서버 기반 전환 후에도 핵심 제목과 가입 행동을 보여준다', () => {
    render(<LandingPage />);

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: /사람이 바뀌어도,\s*집의 기록은\s*남습니다/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: '사전 회원 가입 하기' }).length,
    ).toBeGreaterThan(0);
  });
});
