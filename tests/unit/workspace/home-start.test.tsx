import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStart } from '@/features/workspace/components/HomeStart';

describe('HomeStart', () => {
  it('shows an office creation path to a principal broker without an office', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[]} />);

    expect(screen.getByRole('heading', { name: '사무소의 첫 기록 공간을 만드세요' })).toBeInTheDocument();
    expect(screen.getByLabelText('사무소 이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사무소 만들기' })).toBeInTheDocument();
  });

  it('does not let non-principal users create an office', () => {
    render(<HomeStart primaryRole="assistant" offices={[]} />);

    expect(screen.queryByRole('button', { name: '사무소 만들기' })).not.toBeInTheDocument();
    expect(screen.getByText('사무소 초대를 확인해 주세요')).toBeInTheDocument();
  });

  it('shows the next build order without linking to unfinished routes', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[{ id: 'office-1', name: '집신 공인중개사무소' }]} />);

    expect(screen.getByText('집신 공인중개사무소')).toBeInTheDocument();
    expect(screen.getByText('첫 집 등록하기')).toBeInTheDocument();
    expect(screen.getByText('구성원 초대하기')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
