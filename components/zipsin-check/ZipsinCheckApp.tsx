'use client';

import {useEffect, useState} from 'react';
import {archiveCandidate, createCandidate, restoreCandidate} from '@/lib/zipsin-check/state';
import {loadCheckState, saveCheckState} from '@/lib/zipsin-check/storage';
import type {Candidate, CheckDepth} from '@/lib/zipsin-check/types';
import CheckStart from './CheckStart';
import CheckFlow from './CheckFlow';
import CheckSummary from './CheckSummary';
import CheckCompare from './CheckCompare';
import styles from './ZipsinCheck.module.css';

type Screen = 'start' | 'check' | 'summary' | 'compare';

export default function ZipsinCheckApp({storage}: {storage?: Storage}) {
  const [screen, setScreen] = useState<Screen>('start');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [activeId, setActiveId] = useState<string>();
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState('');
  const activeCandidate = candidates.find((candidate) => candidate.id === activeId);

  useEffect(() => {
    const loaded = loadCheckState(storage ?? window.localStorage);
    if (loaded.ok && loaded.state) {
      setCandidates(loaded.state.candidates);
      setActiveId(loaded.state.activeCandidateId);
    } else if (!loaded.ok) {
      setStorageError('이 기기의 이전 기록을 불러오지 못했어요. 현재 화면에서 새로 시작할 수 있어요.');
    }
    setHydrated(true);
  }, [storage]);

  useEffect(() => {
    if (!hydrated) return;
    const saved = saveCheckState({schemaVersion: 1, candidates, ...(activeId ? {activeCandidateId: activeId} : {})}, storage ?? window.localStorage);
    setStorageError(saved.ok ? '' : '현재 체크는 유지되지만 이 기기에 저장하지 못했어요. 브라우저 저장 설정을 확인해 주세요.');
  }, [activeId, candidates, hydrated, storage]);

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

  function archive(id: string) {
    setCandidates((current) => archiveCandidate(current, id, new Date().toISOString()));
    if (activeId === id) setActiveId(undefined);
  }

  function restore(id: string) {
    try {
      setCandidates((current) => restoreCandidate(current, id, new Date().toISOString()));
    } catch (error) {
      setStorageError(error instanceof Error ? error.message : '후보를 다시 포함하지 못했어요.');
    }
  }

  const notice = storageError ? <p role="alert" className={styles.storageAlert}>{storageError}</p> : null;

  if (screen === 'start' || !activeCandidate) {
    return <div className={styles.app}>{notice}<CheckStart candidates={candidates} onStart={start} onResume={resume} onArchive={archive} onRestore={restore}/></div>;
  }

  if (screen === 'check') return <div className={styles.app}>{notice}<CheckFlow candidate={activeCandidate} onChange={changeCandidate} onFinish={() => setScreen('summary')} onBack={() => setScreen('start')}/></div>;

  if (screen === 'compare') return <div className={styles.app}>{notice}<CheckCompare candidates={candidates} onBack={() => setScreen('summary')}/></div>;

  return <div className={styles.app}>{notice}<CheckSummary candidate={activeCandidate} canCompare={candidates.filter((candidate) => !candidate.archived).length >= 2} onBack={() => setScreen('check')} onAdd={() => setScreen('start')} onCompare={() => setScreen('compare')}/></div>;
}
