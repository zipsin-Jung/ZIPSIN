import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sendMock = vi.hoisted(() => vi.fn());
vi.mock('@/features/chat/hooks/use-room-stream', () => ({
  useRoomStream: (_roomId: string, initial: unknown[]) => ({ messages: initial, connection: 'connected' }),
}));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/features/chat/actions/send-message', () => ({ sendMessageAction: sendMock }));
import { ChatList } from '@/features/chat/components/ChatList';
import { ChatRoom } from '@/features/chat/components/ChatRoom';
import { MessageComposer } from '@/features/chat/components/MessageComposer';

const roomId = '00000000-0000-4000-8000-000000000001';

describe('chat UI states', () => {
  beforeEach(() => { localStorage.clear(); sendMock.mockReset(); });
  it('shows a useful empty state in the room list', () => {
    render(<ChatList rooms={[]} />);
    expect(screen.getByRole('heading', { name: '아직 대화가 없습니다' })).toBeInTheDocument();
    expect(screen.getByText(/집이나 사무소에서 대화를 시작/)).toBeInTheDocument();
  });

  it('shows messages and identifies the current user', () => {
    render(<ChatRoom roomId={roomId} currentUserId="user-1" active initialMessages={[
      { id: 2, room_id: roomId, sender_user_id: 'user-1', body: '확인했습니다.', created_at: '2026-10-13T00:00:00Z' },
      { id: 1, room_id: roomId, sender_user_id: 'user-2', body: '사진을 올렸습니다.', created_at: '2026-10-12T23:59:00Z' },
    ]} attachments={[]} />);
    expect(screen.getByText('확인했습니다.')).toBeInTheDocument();
    expect(screen.getByText('나')).toBeInTheDocument();
    expect(screen.getByText('참여자')).toBeInTheDocument();
  });

  it('disables sending when the room relationship has ended', () => {
    render(<ChatRoom roomId={roomId} currentUserId="user-1" active={false} initialMessages={[]} attachments={[]} />);
    expect(screen.getByText('이 대화의 참여 권한이 종료되었습니다.')).toBeInTheDocument();
    expect(screen.queryByRole('textbox', { name: '메시지' })).not.toBeInTheDocument();
  });

  it('explains direct attachment behavior and offline state', () => {
    render(<MessageComposer roomId={roomId} online={false} />);
    expect(screen.getByText('집 기록에 자동 저장되지 않아요')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '메시지 보내기' })).toBeDisabled();
    expect(screen.getByText(/인터넷 연결을 확인/)).toBeInTheDocument();
  });

  it('keeps a failed draft for retry and clears it after success', async () => {
    const user = userEvent.setup();
    sendMock.mockResolvedValueOnce({ error: '전송하지 못했습니다.' }).mockResolvedValueOnce({ messageId: 7 });
    render(<MessageComposer roomId={roomId} />);
    const input = screen.getByRole('textbox', { name: '메시지' });
    await user.type(input, '다시 보낼 내용');
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }));
    expect(await screen.findByText('전송하지 못했습니다.')).toBeInTheDocument();
    expect(input).toHaveValue('다시 보낼 내용');
    expect(localStorage.getItem(`zipsin-chat-draft:${roomId}`)).toBe('다시 보낼 내용');
    await user.click(screen.getByRole('button', { name: '메시지 보내기' }));
    await waitFor(() => expect(input).toHaveValue(''));
    expect(screen.getByText('전송했습니다.')).toBeInTheDocument();
  });
});
