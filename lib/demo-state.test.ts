import {describe, expect, it} from 'vitest';
import {changeAssignee, changeStatus, initialDemoState, nextAction} from './demo-state';

describe('sales demo workflow state', () => {
  it('changes the next action as the incident progresses', () => {
    expect(nextAction('접수')).toContain('방문 일정');
    expect(nextAction('처리 중')).toContain('사진과 영수증');
    expect(nextAction('완료')).toContain('광고 가능');
  });

  it('moves a manager workflow from receipt to completion', () => {
    const processing = changeStatus(initialDemoState, '처리 중');
    const reassigned = changeAssignee(processing, '최보조');
    const completed = changeStatus(reassigned, '완료');

    expect(completed.status).toBe('완료');
    expect(completed.assignee).toBe('최보조');
    expect(completed.notice).toContain('가상 데이터');
    expect(nextAction(completed.status)).toContain('임대인');
  });

  it('does not let an assistant change the assignee', () => {
    const assistant = {...initialDemoState, role: 'assistant' as const};
    const result = changeAssignee(assistant, '최보조');

    expect(result.assignee).toBe('박보조');
    expect(result.notice).toContain('대표 화면');
  });

  it('allows a manager to restore the original assignee', () => {
    const changed = changeAssignee(initialDemoState, '최보조');
    const restored = changeAssignee(changed, '박보조');

    expect(restored.assignee).toBe('박보조');
    expect(restored.notice).toContain('실제 계정 권한은 변경되지 않습니다');
  });
});
