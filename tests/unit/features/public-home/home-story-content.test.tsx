import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductEvidence } from '@/features/public-home/components/ProductEvidence';
import { publicHomeStories } from '@/features/public-home/scenarios';

describe('public home story content', () => {
  it('TEST-RC-HERO-STORY-001 네 장을 모인다·이어진다·연결된다·가치가 된다 순서로 설명한다', () => {
    expect(publicHomeStories.map((story) => story.shortTitle)).toEqual([
      '모인다',
      '이어진다',
      '연결된다',
      '가치가 된다',
    ]);
    expect(publicHomeStories).toHaveLength(4);
    expect(publicHomeStories[0].headline).toBe('계약과 동시에 흩어지는 부동산 정보, 집신 한곳에 모아 관리하고 하나의 집 이력으로 가치를 키웁니다.');
    expect(publicHomeStories[3].headline).toBe('위치와 서류만 보고 계신가요?');
  });

  it('TEST-RC-HERO-SAFE-001 외부 연락 자동 연동이나 검증·가격 보장을 약속하지 않는다', () => {
    const allCopy = publicHomeStories
      .flatMap((story) => [story.headline, story.description, story.conclusion ?? ''])
      .join(' ');

    expect(allCopy).not.toMatch(/카카오톡 연동|자동 가져오기|검증된 집|가치 상승 보장/);
  });

  it.each([
    ['gather', ['사진', '문서', '대화', '일정']],
    ['continuity', ['입주 사진', '접근 종료', '새 관계']],
    ['communication', ['직접 초대', '집별 연락처', '집신 채팅', '새 기록']],
    ['home-history', ['입주', '확인', '교체', '수리', '현재']],
  ] as const)('TEST-RC-HERO-EVIDENCE-001 %s 장면에 대응하는 제품 증거를 보여준다', (id, labels) => {
    const story = publicHomeStories.find((candidate) => candidate.id === id);
    expect(story).toBeDefined();

    render(<ProductEvidence story={story!} />);

    for (const label of labels) {
      expect(screen.getAllByText(label, { exact: false }).length).toBeGreaterThan(0);
    }
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('TEST-RC-HERO-SAFE-002 연락 장면은 외부 이력을 가져오지 않고 집신에서 새 기록을 시작한다고 밝힌다', () => {
    const story = publicHomeStories.find((candidate) => candidate.id === 'communication');
    expect(story).toBeDefined();

    render(<ProductEvidence story={story!} />);

    expect(screen.getByText(/외부 통화·문자·메신저 이력은 가져오지 않습니다/)).toBeInTheDocument();
    expect(screen.getByText(/집신에서 새 기록이 시작됩니다/)).toBeInTheDocument();
  });
});
