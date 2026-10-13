import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/chat/hooks/use-room-stream', () => ({ useRoomStream: (_roomId: string, messages: unknown[]) => ({ messages, connection: 'connected' }) }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
vi.mock('@/features/support/actions/reply-support', () => ({ replySupportAction: vi.fn(), setSupportMuteAction: vi.fn(), setSupportStatusAction: vi.fn() }));
vi.mock('@/features/chat/actions/report-message', () => ({ reportMessageAction: vi.fn() }));
import { SupportConversation } from '@/features/support/components/SupportConversation';

const roomId = '00000000-0000-4000-8000-000000000001';

describe('official support conversation', () => {
  it('shows privacy guidance, waiting state, and an unforgeable official sender label', () => {
    render(<SupportConversation roomId={roomId} currentUserId="user-1" status="waiting" representative={false} muted={false} attachments={[]} messages={[{
      id: 1, room_id: roomId, sender_user_id: 'representative-1', body: '집신 고객지원입니다.', created_at: '2026-10-13T00:00:00Z', sender_kind: 'support', support_identity_id: 'identity-1',
    }]} />);
    expect(screen.getByText(/주민등록번호, 계좌 비밀번호/)).toBeInTheDocument();
    expect(screen.getByText('상태 · 답변 대기')).toBeInTheDocument();
    expect(screen.getByText('집신 고객지원 ✓')).toBeInTheDocument();
    expect(screen.getByText('집신 고객지원입니다.')).toBeInTheDocument();
  });
});
