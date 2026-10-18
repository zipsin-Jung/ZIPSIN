import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import CleanPage from '@/app/cl/page';

afterEach(() => vi.unstubAllEnvs());

describe('/cl 페이지 — 실서비스에서는 준비 중만', () => {
  it('TEST-CL-PAGE-001 shows only the preparing screen on the live site', () => {
    vi.stubEnv('VERCEL_ENV', 'production');
    render(<CleanPage />);
    expect(screen.getByRole('heading', { level: 1, name: '집신클린 서비스 준비 중이에요' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '가격 보기' })).not.toBeInTheDocument();
  });

  it('TEST-CL-PAGE-002 opens the hands-on demo on Preview with a demo label', () => {
    vi.stubEnv('VERCEL_ENV', 'preview');
    render(<CleanPage />);
    expect(screen.getByText('체험용')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가격 보기' })).toBeInTheDocument();
  });
});
