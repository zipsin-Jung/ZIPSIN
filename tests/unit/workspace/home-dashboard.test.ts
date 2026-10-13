import { describe, expect, it, vi } from 'vitest';
import { formatDashboardAddress, loadHomeDashboard } from '@/features/workspace/services/home-dashboard';

const rows = {
  homes: [
    { id: 'recent', label: '최근 집', address: '서울 C', updatedAt: '2026-10-13T10:00:00Z' },
    { id: 'task', label: '할 일 집', address: '서울 B', updatedAt: '2026-10-12T10:00:00Z' },
    { id: 'expiry', label: '만기 집', address: '서울 A', updatedAt: '2026-10-01T10:00:00Z' },
  ],
  contracts: [
    { id: 'contract-expiry', homeId: 'expiry', endsOn: '2026-11-01' },
    { id: 'contract-task', homeId: 'task', endsOn: '2027-12-01' },
  ],
  records: [
    { id: 'task-1', homeId: 'task', kind: 'task', title: '수리 일정 확인', taskStatus: 'todo', taskDueAt: '2026-10-15T00:00:00Z', occurredAt: '2026-10-10T00:00:00Z' },
  ],
  notifications: [
    { kind: 'chat_message', readAt: null },
    { kind: 'chat_message', readAt: null },
    { kind: 'system', readAt: null },
  ],
};

describe('loadHomeDashboard', () => {
  it('TEST-ZH-DATA-007 masks the unit detail before it reaches the dashboard UI', () => {
    expect(formatDashboardAddress('서울 노원구 예시로 10', '101동 1401호')).toBe('서울 노원구 예시로 10 · 상세 주소 보호됨');
    expect(formatDashboardAddress('서울 노원구 예시로 10', null)).toBe('서울 노원구 예시로 10');
  });
  it('TEST-ZH-DATA-004 sorts expiry first, then open work, then recent use', async () => {
    const load = vi.fn().mockResolvedValue({ data: rows, error: null });
    const result = await loadHomeDashboard({ load }, { today: new Date('2026-10-12T15:00:00Z') });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.homes.map((home) => home.id)).toEqual(['expiry', 'task', 'recent']);
  });

  it('TEST-ZH-DATA-005 keeps unread chat and all unread notification counts distinct', async () => {
    const result = await loadHomeDashboard({ load: vi.fn().mockResolvedValue({ data: rows, error: null }) });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.unreadChatCount).toBe(2);
      expect(result.notificationCount).toBe(3);
    }
  });

  it('TEST-ZH-DATA-006 returns a safe failure instead of a fake empty dashboard', async () => {
    const result = await loadHomeDashboard({ load: vi.fn().mockResolvedValue({ data: null, error: { message: 'private database detail' } }) });
    expect(result).toEqual({ ok: false, error: 'load_failed' });
  });
});
