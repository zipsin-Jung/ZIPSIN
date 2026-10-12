import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HomeStart } from '@/features/workspace/components/HomeStart';

describe('HomeStart', () => {
  it('shows an office creation path to a principal broker without an office', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[]} />);

    expect(screen.getByRole('heading', { name: '집의 모든 기록과 대화를한곳에서 이어가세요' })).toBeInTheDocument();
    expect(screen.getByText('집을 등록하고')).toBeInTheDocument();
    expect(screen.getByText('기록을 남기고')).toBeInTheDocument();
    expect(screen.getByText('함께 이야기합니다')).toBeInTheDocument();
    expect(screen.getByLabelText('사무소 이름')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '사무소 만들기' })).toBeInTheDocument();
  });

  it('does not let non-principal users create an office', () => {
    render(<HomeStart primaryRole="assistant" offices={[]} />);

    expect(screen.queryByRole('button', { name: '사무소 만들기' })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '집의 모든 기록과 대화를한곳에서 이어가세요' })).toBeInTheDocument();
    expect(screen.getByText('연결된 공간을 확인해 주세요')).toBeInTheDocument();
  });

  it('TEST-HOME-016 links the first registration and the office-filtered home list', () => {
    render(<HomeStart primaryRole="principal_broker" offices={[{ id: 'office-1', name: '집신 공인중개사무소' }]} />);

    expect(screen.getByText('집신 공인중개사무소')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '집의 모든 기록과 대화를한곳에서 이어가세요' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '집 등록하기' })).toHaveAttribute('href', '/homes/new?office=office-1');
    expect(screen.getByRole('link', { name: '집 목록 보기 →' })).toHaveAttribute('href', '/homes?office=office-1');
    expect(screen.getByRole('link', { name: '구성원 관리 →' })).toHaveAttribute('href', '/office/members');
    expect(screen.queryByText(/담당/)).not.toBeInTheDocument();
  });
});
