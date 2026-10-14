'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Pause, Play, ShieldCheck } from 'lucide-react';
import { publicHomeStories, type HomeStoryId } from '../scenarios';
import { ProductEvidence } from './ProductEvidence';
import styles from '@/components/PublicHome.module.css';

const AUTOPLAY_MS = 7000;
const HOVER_SELECT_MS = 250;
const HOVER_RESUME_MS = 1500;
const SWIPE_THRESHOLD_PX = 48;

export function HomeStoryCarousel() {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [manual, setManual] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(true);
  const [resumeReady, setResumeReady] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<HomeStoryId>>(() => new Set());
  const hoverSelectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);
  const wasInteractionPaused = useRef(false);
  const lastIndex = publicHomeStories.length - 1;
  const story = publicHomeStories[selectedIndex];

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => {
      setReducedMotion(query.matches);
      if (query.matches) setAutoplay(false);
    };
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    const update = () => setVisible(document.visibilityState === 'visible');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  useEffect(() => {
    const interactionPaused = hovered || focused;
    if (interactionPaused) {
      wasInteractionPaused.current = true;
      setResumeReady(false);
      return;
    }
    if (!wasInteractionPaused.current) return;
    wasInteractionPaused.current = false;
    const timer = window.setTimeout(() => setResumeReady(true), HOVER_RESUME_MS);
    return () => window.clearTimeout(timer);
  }, [focused, hovered]);

  useEffect(() => {
    if (!autoplay || manual || hovered || focused || !visible || !resumeReady || reducedMotion || selectedIndex >= lastIndex) return;
    const timer = window.setTimeout(() => {
      const nextIndex = selectedIndex + 1;
      setSelectedIndex(nextIndex);
      if (nextIndex === lastIndex) setAutoplay(false);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [autoplay, focused, hovered, lastIndex, manual, reducedMotion, resumeReady, selectedIndex, visible]);

  useEffect(() => () => {
    if (hoverSelectTimer.current) clearTimeout(hoverSelectTimer.current);
  }, []);

  function selectManually(index: number) {
    setSelectedIndex(Math.max(0, Math.min(lastIndex, index)));
    setManual(true);
    setAutoplay(false);
  }

  function scheduleHoverSelection(index: number) {
    if (hoverSelectTimer.current) clearTimeout(hoverSelectTimer.current);
    hoverSelectTimer.current = setTimeout(() => setSelectedIndex(index), HOVER_SELECT_MS);
  }

  function cancelHoverSelection() {
    if (!hoverSelectTimer.current) return;
    clearTimeout(hoverSelectTimer.current);
    hoverSelectTimer.current = null;
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      selectManually(selectedIndex + 1);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      selectManually(selectedIndex - 1);
    }
    if (event.key === 'Home') {
      event.preventDefault();
      selectManually(0);
    }
    if (event.key === 'End') {
      event.preventDefault();
      selectManually(lastIndex);
    }
  }

  function handlePlayToggle() {
    if (autoplay) {
      setAutoplay(false);
      setManual(true);
      return;
    }
    if (reducedMotion) return;
    if (selectedIndex === lastIndex) setSelectedIndex(0);
    setManual(false);
    setResumeReady(true);
    setAutoplay(true);
  }

  function handlePointerUp(event: React.PointerEvent) {
    if (!pointerStart.current) return;
    const deltaX = event.clientX - pointerStart.current.x;
    const deltaY = event.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(deltaX) < SWIPE_THRESHOLD_PX || Math.abs(deltaX) <= Math.abs(deltaY)) return;
    selectManually(deltaX < 0 ? selectedIndex + 1 : selectedIndex - 1);
  }

  function markImageFailed(id: HomeStoryId) {
    setFailedImages((current) => new Set(current).add(id));
  }

  return <section
    className={styles.storyCarousel}
    role="region"
    aria-roledescription="carousel"
    aria-label="집신이 필요한 네 장면"
    onKeyDown={handleKeyDown}
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    onFocusCapture={() => setFocused(true)}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
    }}
  >
    <div
      className={styles.storyStage}
      data-testid="home-story-stage"
      onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY }; }}
      onPointerUp={handlePointerUp}
      onPointerCancel={() => { pointerStart.current = null; }}
    >
      <article key={story.id} className={styles.storySlide} role="group" aria-roledescription="slide" aria-label={`${selectedIndex + 1} / ${publicHomeStories.length}: ${story.shortTitle}`}>
        <div className={styles.storyCopy}>
          <span className={styles.kicker}>{story.shortTitle}</span>
          <h1>{story.headline}</h1>
          <p>{story.description}</p>
          {story.conclusion && <strong className={styles.storyConclusion}>{story.conclusion}</strong>}
          <div className={styles.heroActions}>
            <Link className={styles.primary} href="/signup">{selectedIndex === lastIndex ? '내 집 기록 시작하기' : '웹에서 시작하기'} <ArrowRight size={19} aria-hidden="true" /></Link>
            <Link className={styles.secondary} href="/login">로그인</Link>
          </div>
          <span className={styles.safety}><ShieldCheck size={17} aria-hidden="true" /> 주소만 알아서는 어떤 기록도 볼 수 없습니다.</span>
        </div>

        <div className={`${styles.storyVisual} ${story.id === 'gather' ? styles.storyVisualPortrait : ''}`}>
          <div className={`${styles.storyImageFrame} ${story.id === 'gather' ? styles.storyImagePortrait : ''}`}>
            {failedImages.has(story.id)
              ? <div className={styles.imageFallback} role="status">이미지를 불러오지 못했습니다.</div>
              : <Image key={story.id} src={story.imageSrc} alt={story.imageAlt} fill sizes="(max-width: 980px) 100vw, 54vw" priority={selectedIndex === 0} onError={() => markImageFailed(story.id)} />}
          </div>
          <ProductEvidence story={story} />
        </div>
      </article>
    </div>

    <div className={styles.storyControls} aria-label="장면 제어">
      <button type="button" onClick={() => selectManually(selectedIndex - 1)} disabled={selectedIndex === 0} aria-label="이전 장면"><ArrowLeft size={20} aria-hidden="true" /></button>
      <span className={styles.storyCount}>{selectedIndex + 1} / {publicHomeStories.length}</span>
      <div className={styles.storyDots} aria-label="장면 목차">
        {publicHomeStories.map((item, index) => <button
          key={item.id}
          type="button"
          aria-label={`${item.shortTitle} 장면 보기`}
          aria-current={selectedIndex === index ? 'true' : undefined}
          onClick={() => selectManually(index)}
          onPointerEnter={() => scheduleHoverSelection(index)}
          onPointerLeave={cancelHoverSelection}
        ><span>{item.shortTitle}</span></button>)}
      </div>
      <button type="button" onClick={() => selectManually(selectedIndex + 1)} disabled={selectedIndex === lastIndex} aria-label="다음 장면"><ArrowRight size={20} aria-hidden="true" /></button>
      <button type="button" onClick={handlePlayToggle} disabled={reducedMotion} aria-label={autoplay ? '자동 넘김 일시정지' : '자동 넘김 재생'}>
        {autoplay ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}
      </button>
    </div>
  </section>;
}
