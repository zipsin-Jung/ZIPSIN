import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { createRecord } = vi.hoisted(() => ({ createRecord: vi.fn() }));
vi.mock('@/features/records/actions/create-record', () => ({ createRecordAction: createRecord }));

import { RecordForm } from '@/features/records/components/RecordForm';

const props = {
  homeId: '00000000-0000-4000-8000-000000000001',
  officeId: '00000000-0000-4000-8000-000000000002',
  idempotencyKey: '00000000-0000-4000-8000-000000000003',
};

describe('RecordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('TEST-RC-REC-002 keeps the written record and explains a temporary failure', async () => {
    createRecord.mockRejectedValueOnce(new Error('private database details'));
    const user = userEvent.setup();
    render(<RecordForm {...props} />);

    await user.type(screen.getByLabelText('제목'), '입주 전 벽지 상태');
    await user.type(screen.getByLabelText('내용'), '거실 오른쪽에 오염이 있음');
    await user.click(screen.getByRole('button', { name: '집 기록에 남기기' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('작성한 내용은 그대로 있어요. 잠시 후 다시 저장해 주세요.');
    expect(screen.getByLabelText('제목')).toHaveValue('입주 전 벽지 상태');
    expect(screen.getByLabelText('내용')).toHaveValue('거실 오른쪽에 오염이 있음');
    expect(screen.queryByText('private database details')).not.toBeInTheDocument();
  });
});
