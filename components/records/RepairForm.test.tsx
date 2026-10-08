import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {afterEach, describe, expect, it, vi} from 'vitest';
import RepairForm from './RepairForm';
import type {RepairRecord} from '@/lib/repairs/types';

afterEach(cleanup);

const record: RepairRecord = {
  id: '11111111-1111-4111-8111-111111111111', title: '욕실 누수', home_alias: '테스트 주택 A',
  category: 'plumbing', status: 'received', description: '가상 수리 기록을 위한 상세 설명입니다.',
  repair_date: '2026-10-08', image_path: 'id/image.jpg', image_url: 'https://example.com/image.jpg',
  created_at: '2026-10-08T00:00:00Z', updated_at: '2026-10-08T00:00:00Z',
};

describe('RepairForm image removal', () => {
  it('이미지 삭제를 선택해도 체크박스와 제출값을 유지한다', () => {
    render(<RepairForm record={record} action={vi.fn(async () => ({}))}/>);
    const checkbox = screen.getByRole('checkbox', {name: /이미지 삭제/});
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(checkbox.closest('form')).toHaveFormValues({removeImage: true});
  });
});
