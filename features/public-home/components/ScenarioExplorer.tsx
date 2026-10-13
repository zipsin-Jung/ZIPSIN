'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { publicHomeScenarios } from '../scenarios';
import { ProductEvidence } from './ProductEvidence';
import styles from '@/components/PublicHome.module.css';

export function ScenarioExplorer() {
  const [selectedId, setSelectedId] = useState(publicHomeScenarios[0].id);
  const [failedImageId, setFailedImageId] = useState<string | null>(null);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const selected = publicHomeScenarios.find((scenario) => scenario.id === selectedId) ?? publicHomeScenarios[0];

  function moveSelection(index: number, direction: -1 | 1) {
    const next = (index + direction + publicHomeScenarios.length) % publicHomeScenarios.length;
    setSelectedId(publicHomeScenarios[next].id);
    tabRefs.current[next]?.focus();
    tabRefs.current[next]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  return <div className={styles.scenarioExplorer}>
    <div className={styles.scenarioTabs} role="tablist" aria-label="집신이 필요한 생활 순간">
      {publicHomeScenarios.map((scenario, index) => <button key={scenario.id} ref={(node) => { tabRefs.current[index] = node; }} id={`scenario-tab-${scenario.id}`} type="button" role="tab" aria-selected={selected.id === scenario.id} aria-controls={`scenario-panel-${scenario.id}`} tabIndex={selected.id === scenario.id ? 0 : -1} onClick={() => setSelectedId(scenario.id)} onKeyDown={(event) => {
        if (event.key === 'ArrowRight') { event.preventDefault(); moveSelection(index, 1); }
        if (event.key === 'ArrowLeft') { event.preventDefault(); moveSelection(index, -1); }
      }} className={styles.scenarioTab}><span>{scenario.eyebrow}</span><strong>{scenario.title}</strong><ArrowRight size={18} aria-hidden="true" /></button>)}
    </div>
    <div className={styles.scenarioResult}>
      <div className={styles.scenarioStory}>
        <span className={styles.sceneLabel}>생활 장면 예시</span>
        <div className={styles.scenarioCopy}><span className={styles.prevents}>{selected.prevents}을 막는 기록</span><h3>{selected.question}</h3><p>{selected.result}</p></div>
        <div className={styles.sceneImage}>
          {failedImageId === selected.id
            ? <div className={styles.imageFallback} role="status">이미지를 불러오지 못했습니다.</div>
            : <Image key={selected.id} src={selected.imageSrc} alt={selected.imageAlt} fill sizes="(max-width: 980px) 100vw, 50vw" priority={selected.id === publicHomeScenarios[0].id} onError={() => setFailedImageId(selected.id)} />}
        </div>
        <Link className={styles.scenarioCta} href="/signup">이 집 기록 시작하기 <ArrowRight size={17} aria-hidden="true" /></Link>
      </div>
      <ProductEvidence scenario={selected} />
    </div>
  </div>;
}
