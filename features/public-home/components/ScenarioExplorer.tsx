'use client';

import { useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { publicHomeScenarios } from '../scenarios';
import { ProductEvidence } from './ProductEvidence';
import styles from '@/components/PublicHome.module.css';

export function ScenarioExplorer() {
  const [selectedId, setSelectedId] = useState(publicHomeScenarios[0].id);
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
    <div className={styles.scenarioResult}><div className={styles.scenarioCopy}><span className={styles.prevents}>{selected.prevents}을 막는 기록</span><h3>{selected.question}</h3><p>{selected.result}</p></div><ProductEvidence scenario={selected} /></div>
  </div>;
}
