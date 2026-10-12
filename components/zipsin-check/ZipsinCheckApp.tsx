'use client';

import {useEffect, useState} from 'react';
import {createCandidate} from '@/lib/zipsin-check/state';
import {loadCheckState} from '@/lib/zipsin-check/storage';
import type {Candidate, CheckDepth} from '@/lib/zipsin-check/types';
import CheckStart from './CheckStart';
import CheckFlow from './CheckFlow';
import CheckSummary from './CheckSummary';
import CheckCompare from './CheckCompare';
import styles from './ZipsinCheck.module.css';

type Screen = 'start' | 'check' | 'summary' | 'compare';

export default function ZipsinCheckApp() {
  const [screen, setScreen] = useState<Screen>('start');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const activeCandidate = candidates.find((candidate) => candidate.id === activeId);

  useEffect(() => {
    const loaded = loadCheckState(window.localStorage);
    if (loaded.ok && loaded.state) {
      setCandidates(loaded.state.candidates);
      setActiveId(loaded.state.activeCandidateId);
    }
  }, []);

  function start(depth: CheckDepth, alias: string) {
    const id = `candidate-${Date.now()}-${candidates.length + 1}`;
    const candidate = createCandidate({id, alias: alias || `후보 ${candidates.filter((item) => !item.archived).length + 1}`, depth, now: new Date().toISOString()});
    setCandidates((current) => [...current, candidate]);
    setActiveId(id);
    setScreen('check');
  }

  function resume(id: string) {
    setActiveId(id);
    setScreen('check');
  }

  function changeCandidate(next: Candidate) {
    setCandidates((current) => current.map((candidate) => candidate.id === next.id ? next : candidate));
  }

  if (screen === 'start' || !activeCandidate) {
    return <div className={styles.app}><CheckStart candidates={candidates} onStart={start} onResume={resume}/></div>;
  }

  if (screen === 'check') return <div className={styles.app}><CheckFlow candidate={activeCandidate} onChange={changeCandidate} onFinish={() => setScreen('summary')} onBack={() => setScreen('start')}/></div>;

  if (screen === 'compare') return <div className={styles.app}><CheckCompare candidates={candidates} onBack={() => setScreen('summary')}/></div>;

  return <div className={styles.app}><CheckSummary candidate={activeCandidate} canCompare={candidates.filter((candidate) => !candidate.archived).length >= 2} onBack={() => setScreen('check')} onAdd={() => setScreen('start')} onCompare={() => setScreen('compare')}/></div>;
}
