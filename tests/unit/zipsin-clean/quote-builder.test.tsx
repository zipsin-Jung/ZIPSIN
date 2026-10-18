import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { QuoteBuilder } from '@/features/zipsin-clean/components/QuoteBuilder';

describe('QuoteBuilder — 우리 집 청소 가격 바로 보기', () => {
  it('TEST-UI-001 shows one fixed price after choosing facts, with people, time and what is included', async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);
    await user.clear(screen.getByLabelText('평수 (공급면적)'));
    await user.type(screen.getByLabelText('평수 (공급면적)'), '24');
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    const result = await screen.findByRole('region', { name: '예상 가격' });
    expect(within(result).getByText('325,000원')).toBeInTheDocument();
    expect(within(result).getByText('2명 · 약 7시간')).toBeInTheDocument();
    expect(within(result).getByText('작업을 시작한 뒤에는 가격이 바뀌지 않아요.')).toBeInTheDocument();
    expect(within(result).getByText(/평수·방·욕실 수가 실제와 다를 때만/)).toBeInTheDocument();
    expect(within(result).getByRole('button', { name: '예약하기 · 준비 중' })).toBeDisabled();
  });

  it('TEST-UI-002 lets the customer answer "모름" and says the price already covers it', async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);
    await user.click(screen.getByRole('radio', { name: /통베란다/ }));
    await user.click(within(screen.getByRole('radiogroup', { name: '담배를 피운 집인가요?' })).getByRole('radio', { name: '모름' }));
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    const result = await screen.findByRole('region', { name: '예상 가격' });
    expect(within(result).getByText('모른다고 고른 1가지는 조금 넉넉하게 계산했어요. 현장에서 더 받지 않아요.')).toBeInTheDocument();
    expect(within(result).getByText('베란다 물청소')).toBeInTheDocument();
  });

  it('TEST-UI-003 switches to hourly tidy cleaning and changes the price when hours change', async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);
    await user.click(screen.getByRole('radio', { name: /생활 정리 청소/ }));
    expect(screen.queryByRole('radiogroup', { name: '베란다는 어떻게 생겼나요?' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: '4시간' }));
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    const result = await screen.findByRole('region', { name: '예상 가격' });
    expect(within(result).getByText('70,000원')).toBeInTheDocument();
    expect(within(result).getByText('1명 · 4시간')).toBeInTheDocument();
  });

  it('TEST-UI-004 shows an error instead of a price for an impossible size, and hides an old price when facts change', async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    expect(await screen.findByRole('region', { name: '예상 가격' })).toBeInTheDocument();
    await user.clear(screen.getByLabelText('평수 (공급면적)'));
    await user.type(screen.getByLabelText('평수 (공급면적)'), '3');
    expect(screen.queryByRole('region', { name: '예상 가격' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    expect(screen.getByRole('alert')).toHaveTextContent('평수는 5~80평 사이로 적어 주세요.');
  });

  it('TEST-UI-005 tells honestly which numbers are temporary until partner interviews', async () => {
    const user = userEvent.setup();
    render(<QuoteBuilder />);
    await user.click(screen.getByRole('button', { name: '가격 보기' }));
    expect(screen.getByText(/임시 기준/)).toBeInTheDocument();
  });
});
