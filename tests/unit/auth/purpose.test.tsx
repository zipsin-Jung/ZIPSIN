import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PurposePicker } from '@/features/auth/components/PurposePicker';
import { parseUsageSelection, PURPOSE_OPTIONS } from '@/features/auth/domain/purpose';

describe('usage purpose onboarding', () => {
  it('TEST-ZH-LIFE-001-A maps tenant and landlord purposes without granting a house', () => {
    expect(parseUsageSelection({ purpose: 'tenant', brokerRole: null })).toEqual({
      usagePurpose: 'tenant',
      primaryRole: 'tenant',
    });
    expect(parseUsageSelection({ purpose: 'landlord', brokerRole: null })).toEqual({
      usagePurpose: 'landlord',
      primaryRole: 'landlord',
    });
    expect(PURPOSE_OPTIONS).toHaveLength(4);
  });

  it('TEST-ZH-LIFE-001-B requires an exact broker subtype', () => {
    expect(() => parseUsageSelection({ purpose: 'broker', brokerRole: null })).toThrow('세부 역할');
    expect(parseUsageSelection({ purpose: 'broker', brokerRole: 'associate_broker' })).toEqual({
      usagePurpose: 'broker',
      primaryRole: 'associate_broker',
    });
  });

  it('TEST-ZH-LIFE-001-C completes management onboarding without inventing an access role', () => {
    expect(parseUsageSelection({ purpose: 'management_other', brokerRole: null })).toEqual({
      usagePurpose: 'management_other',
      primaryRole: null,
    });
  });

  it('TEST-ZH-LIFE-001-D explains that purpose selection does not open records', async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<PurposePicker onSave={save} />);

    expect(screen.getByText(/이 선택은 화면 안내를 맞추기 위한 것/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '공인중개사' }));
    expect(screen.getByRole('radio', { name: '소속공인중개사' })).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '소속공인중개사' }));
    await user.click(screen.getByRole('button', { name: '집신 시작하기' }));

    expect(save).toHaveBeenCalledWith({ purpose: 'broker', brokerRole: 'associate_broker' });
  });
});
