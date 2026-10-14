import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProductEvidence } from '@/features/public-home/components/ProductEvidence';
import { publicHomeStories } from '@/features/public-home/scenarios';

describe('public home story content', () => {
  it('TEST-RC-HERO-STORY-001 네 장을 서론·본론·과정·결론의 4→3→1→2 순서로 설명한다', () => {
    expect(publicHomeStories.map((story) => story.shortTitle)).toEqual([
      '살펴본다',
      '정리한다',
      '모은다',
      '이어간다',
    ]);
    expect(publicHomeStories).toHaveLength(4);
    expect(publicHomeStories.map((story) => story.id)).toEqual([
      'home-history',
      'communication',
      'gather',
      'continuity',
    ]);
    expect(publicHomeStories.map((story) => story.phase)).toEqual(['서론', '본론', '과정', '결론']);
    expect(publicHomeStories[0].headline).toBe('부동산, 아직도 위치와 서류만 보고 계신가요?');
    expect(publicHomeStories[3].headline).toBe('사람이 바뀌어도, 집의 기록은 남도록.');
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

  it('TEST-PUB-STORY-FIRST-VALUE-001 첫 장만으로 집 한 채에 사진·문서·대화·일정을 연결하는 제품임을 설명한다', () => {
    const firstStory = publicHomeStories[0];
    expect(`${firstStory.description} ${firstStory.conclusion ?? ''}`).toMatch(/사진·문서·대화·일정/);
    expect(`${firstStory.description} ${firstStory.conclusion ?? ''}`).toMatch(/집 한 채/);
  });

  it('TEST-PUB-STORY-PRIVACY-001 공개 카피가 외부 연락 자동수집과 이전 사람 개인정보 승계를 명시적으로 부정한다', () => {
    const communication = publicHomeStories.find((story) => story.id === 'communication');
    const continuity = publicHomeStories.find((story) => story.id === 'continuity');

    expect(communication?.description).toMatch(/외부 연락.*가져오지/);
    expect(communication?.description).toMatch(/초대.*집신 채팅.*새 기록/);
    expect(continuity?.description).toMatch(/개인정보.*비공개 대화.*넘어가지/);
  });
});
