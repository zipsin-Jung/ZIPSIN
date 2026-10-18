import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('@/lib/supabase/client', () => ({ createBrowserSupabaseClient: vi.fn() }));
vi.mock('@/features/attachments/actions/upload', () => ({ prepareAttachmentUploadAction: vi.fn(), completeAttachmentUploadAction: vi.fn() }));
import { HomeRecordList } from '@/features/records/components/HomeRecordList';
import { PhotoGallery } from '@/features/records/components/PhotoGallery';
import { ShareRecordButton } from '@/features/records/components/ShareRecordButton';

afterEach(() => { vi.unstubAllGlobals(); });

describe('home record screens', () => {
  it('TEST-SHARE-001 opens the phone share sheet with a link that only connected people can open', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share });
    render(<ShareRecordButton path="/homes/h1#record-r1" text="[집신] 201호 · 욕실 누수" />);
    await userEvent.click(screen.getByRole('button', { name: '카톡으로 보내기' }));
    expect(share).toHaveBeenCalledWith({ title: '집신 기록', text: '[집신] 201호 · 욕실 누수', url: `${window.location.origin}/homes/h1#record-r1` });
    expect(screen.getByText('링크는 이 집에 연결된 사람만 열 수 있어요.')).toBeInTheDocument();
  });

  it('TEST-SHARE-002 copies the link when the share sheet is not available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } });
    render(<ShareRecordButton path="/homes/h1" text="[집신] 기록" />);
    await userEvent.click(screen.getByRole('button', { name: '카톡으로 보내기' }));
    await waitFor(() => expect(writeText).toHaveBeenCalled());
    expect(screen.getByRole('status')).toHaveTextContent('링크를 복사했어요');
  });

  it('TEST-HOME-REC-001 filters a home record list by space and anchors each record for shared links', async () => {
    const { container } = render(<HomeRecordList homeId="h1" homeName="201호" records={[
      { id: 'r1', kind: 'repair', space: 'current_contract', title: '욕실 누수', occurredAt: '2026-10-15T01:00:00Z', attachments: [] },
      { id: 'r2', kind: 'note', space: 'office_internal', title: '임대인 통화', occurredAt: '2026-10-10T01:00:00Z', attachments: [] },
    ]} />);
    expect(container.querySelector('#record-r1')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '사무소 내부' }));
    expect(screen.queryByText('욕실 누수')).not.toBeInTheDocument();
    expect(screen.getByText('임대인 통화')).toBeInTheDocument();
  });

  it('TEST-GALLERY-001 shows albums with who-can-see notes and an empty state', async () => {
    const { rerender } = render(<PhotoGallery homeId="h1" albums={[{ id: 'r1', title: '입주 사진', space: 'current_contract', occurredAt: '2026-04-01T01:00:00Z', photos: [{ id: 'p1', name: 'a.jpg', url: null }] }]} />);
    expect(screen.getByRole('heading', { name: '입주 사진' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'a.jpg 크게 보기' }));
    expect(screen.getByText(/지금 임대인·임차인도 볼 수 있어요/)).toBeInTheDocument();
    rerender(<PhotoGallery homeId="h1" albums={[]} />);
    expect(screen.getByRole('link', { name: '사진 올리기' })).toHaveAttribute('href', '/homes/h1/records/new');
  });
});
