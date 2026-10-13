import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { HomeDirectory } from '@/features/homes/components/HomeDirectory';

const homes = [
  { id: '1', label: '강남 사무실', address: '서울 강남구 테헤란로 1' },
  { id: '2', label: '노원 햇살집', address: '서울 노원구 동일로 2' },
];

describe('HomeDirectory', () => {
  it('TEST-ZSD-WEB-001 searches only the supplied accessible homes', async () => {
    const user = userEvent.setup();
    render(<HomeDirectory homes={homes} />);
    await user.type(screen.getByRole('searchbox', { name: '집 검색' }), '노원');
    expect(screen.getByRole('heading', { name: '노원 햇살집' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '강남 사무실' })).not.toBeInTheDocument();
  });

  it('TEST-ZSD-WEB-002 shows a distinct empty search result', async () => {
    const user = userEvent.setup();
    render(<HomeDirectory homes={homes} />);
    await user.type(screen.getByRole('searchbox', { name: '집 검색' }), '없는 집');
    expect(screen.getByText('검색 결과가 없습니다.')).toBeInTheDocument();
  });
  it('TEST-ZSD-WEB-003 gives each quick record link a house-specific accessible name', () => {
    render(<HomeDirectory homes={homes} />);
    expect(screen.getByRole('link', { name: '강남 사무실 새 기록' })).toHaveAttribute('href', '/homes/1/records/new');
  });
});
