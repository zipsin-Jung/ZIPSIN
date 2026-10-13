import { describe, expect, it } from 'vitest';
import { canInviteManually, roomTypeLabel, type ChatRoomType } from '@/features/chat/services/room-access';

describe('chat room presentation rules', () => {
  it.each<[ChatRoomType, string]>([
    ['direct', '개인 대화'], ['group', '단체 대화'], ['home_shared', '집 대화'],
    ['office_internal', '사무소 대화'], ['repair_event', '수리 대화'], ['support', '집신 고객지원'],
  ])('labels %s as %s', (type, label) => {
    expect(roomTypeLabel(type)).toBe(label);
  });

  it('allows manual invitations only in a group room', () => {
    expect(canInviteManually('group')).toBe(true);
    expect(canInviteManually('direct')).toBe(false);
    expect(canInviteManually('home_shared')).toBe(false);
  });
});
