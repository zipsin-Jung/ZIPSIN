'use client';
import {useRef, useState} from 'react';
import {Home, MessageCircleQuestion} from 'lucide-react';
import {ASK_ITEMS, CHECK_ITEMS, FIELD_ITEM_IDS} from '@/lib/zipsin-check/catalog';
import {createBrowserPhotoStore, type PhotoStore} from '@/lib/zipsin-check/photo-store';
import {answerItem, containsSensitiveMemo} from '@/lib/zipsin-check/state';
import type {Candidate, CheckAnswer, CheckItem, CheckStatus} from '@/lib/zipsin-check/types';
import MemoPhotoSheet from './MemoPhotoSheet';
import SaveChoiceSheet from './SaveChoiceSheet';
import styles from './ZipsinCheck.module.css';

const DEFAULT_STORE = createBrowserPhotoStore();

type RowProps = {
  item: CheckItem;
  candidate: Candidate;
  onChange: (value: Candidate) => void;
  store: PhotoStore;
  questionIndex?: number;
  detailSeen: boolean;
  onDetailSeen: (itemId: string) => void;
};

function Row({item, candidate, onChange, store, questionIndex, detailSeen, onDetailSeen}: RowProps) {
  const answer = candidate.answers[item.id];
  const [detail, setDetail] = useState(false);
  const [memoOpen, setMemoOpen] = useState(false);
  const [warning, setWarning] = useState('');
  const memoButton = useRef<HTMLButtonElement>(null);
  const isQuestion = questionIndex !== undefined;

  const update = (patch: Partial<CheckAnswer>) => {
    onChange(answerItem(candidate, item.id, {
      ...answer,
      status: answer?.status ?? 'unverified',
      source: answer?.source ?? 'observed',
      ...patch,
    }, new Date().toISOString()));
  };
  const status = (value: CheckStatus) => update({status: value});
  const closeMemo = () => {
    setMemoOpen(false);
    requestAnimationFrame(() => memoButton.current?.focus());
  };
  const detailButton = useRef<HTMLButtonElement>(null);
  // 아래쪽 '접기'로 닫으면 펼치기 버튼으로 돌아가 읽던 자리를 잃지 않게 한다.
  const collapseDetail = () => {
    setDetail(false);
    requestAnimationFrame(() => {
      detailButton.current?.scrollIntoView?.({block: 'nearest', behavior: 'smooth'});
      detailButton.current?.focus({preventScroll: true});
    });
  };
  const toggleDetail = () => {
    onDetailSeen(item.id);
    setDetail(value => !value);
  };

  return <article className={`${styles.fieldRow} ${isQuestion ? styles.questionRow : ''}`}>
    <div className={styles.fieldQuestion}>
      {!isQuestion && <span className={item.core ? styles.requiredStar : styles.recommendedLabel}>{item.core ? '★ 먼저 확인' : item.group}</span>}
      <h2>{isQuestion ? `${questionIndex}. ${item.title}` : item.title}</h2>
      <p>{item.prompt}</p>
    </div>
    {!isQuestion && <div className={styles.fieldStatuses}>
      <button type="button" aria-label={`${item.title} 문제없음`} aria-pressed={answer?.status === 'confirmed'} onClick={() => status('confirmed')}>□ 문제없음</button>
      <button type="button" aria-label={`${item.title} 문제 있음`} aria-pressed={answer?.status === 'caution'} onClick={() => status('caution')}>□ 문제 있음</button>
      <button type="button" aria-label={`${item.title} 못 봤음`} aria-pressed={!answer || answer.status === 'unverified'} onClick={() => status('unverified')}>□ 못 봤음</button>
    </div>}
    <div className={styles.rowActions}>
      <button ref={memoButton} type="button" aria-label={isQuestion ? `${item.title} 답변 기록` : `${item.title} ${answer?.memo ? '메모·사진 있음' : '메모·사진'}`} onClick={() => setMemoOpen(true)}>
        {isQuestion ? (answer?.memo ? '답변 있음' : '답변 기록') : (answer?.memo ? '메모·사진 있음' : '메모·사진')}
      </button>
      <button ref={detailButton} type="button" aria-label={`${item.title} 상세 체크 ${detail ? '접기' : '펼치기'}`} aria-expanded={detail} data-attention={detailSeen ? 'seen' : 'required'} onClick={toggleDetail}>
        {detail ? '상세 접기' : isQuestion ? '질문 펼치기' : '상세 체크'}
      </button>
    </div>
    {detail && <section className={styles.actionChecks} aria-label={`${item.title} 상세 체크`}>
      <h3>{isQuestion ? '이 순서대로 물어보세요' : '여기를 이렇게 확인하세요'}</h3>
      {item.actions?.map(action => <label key={action.id}>
        <input type="checkbox" checked={answer?.actionChecks?.[action.id] ?? false} onChange={event => update({actionChecks: {...answer?.actionChecks, [action.id]: event.target.checked}})} />
        <span>{action.label}</span>
      </label>)}
      <div className={styles.warningSigns}><strong>{isQuestion ? '기록할 것' : '이상 신호'}</strong><p>{item.nextAction}</p></div>
      <div className={styles.whyTip}><strong>💡 왜 확인하나요?</strong><p>{item.why}</p></div>
      <button type="button" className={styles.detailCollapse} aria-label={`${item.title} ${isQuestion ? '질문' : '상세 체크'} 닫기`} onClick={collapseDetail}>접기 ▲</button>
    </section>}
    {warning && <p role="alert" className={styles.warning}>{warning}</p>}
    {memoOpen && <MemoPhotoSheet candidateId={candidate.id} itemId={item.id} itemTitle={isQuestion ? `${item.title} 답변` : item.title} initialMemo={answer?.memo} store={store} onClose={closeMemo} onSave={memo => {
      if (containsSensitiveMemo(memo)) {
        setWarning('연락처나 출입정보는 저장하지 않았어요.');
        return;
      }
      setWarning('');
      update({memo: memo || undefined});
      closeMemo();
    }} />}
  </article>;
}

type CheckFlowProps = {
  candidate: Candidate;
  onChange: (candidate: Candidate) => void;
  onFinish: () => void;
  onBack: () => void;
  onEdit?: () => void;
  initialView?: 'checks' | 'questions';
  photoStore?: PhotoStore;
  canSaveToAccount?: boolean;
  onSaveToAccount?: () => boolean;
  seenDetailIds?: ReadonlySet<string>;
  onDetailSeen?: (itemId: string) => void;
};

export default function CheckFlow({candidate, onChange, onFinish, onBack, onEdit, initialView = 'checks', photoStore = DEFAULT_STORE, canSaveToAccount = true, onSaveToAccount = () => true, seenDetailIds, onDetailSeen}: CheckFlowProps) {
  const [view, setView] = useState<'checks' | 'questions'>(initialView);
  // 질문 체크는 지나치기 쉬워 한 번 열어볼 때까지 노란 강조를 반짝인다.
  const [questionsVisited, setQuestionsVisited] = useState(initialView === 'questions');
  const [saveOpen, setSaveOpen] = useState(false);
  const [localSeenDetailIds, setLocalSeenDetailIds] = useState<ReadonlySet<string>>(new Set());
  const effectiveSeenDetailIds = seenDetailIds ?? localSeenDetailIds;
  const hasSeenDetail = (itemId: string) => effectiveSeenDetailIds.has(itemId) || effectiveSeenDetailIds.has(`${candidate.id}:${itemId}`);
  const markDetailSeen = (itemId: string) => {
    if (onDetailSeen) onDetailSeen(itemId);
    else setLocalSeenDetailIds(current => new Set(current).add(itemId));
  };
  const completed = CHECK_ITEMS.filter(item => {
    const status = candidate.answers[item.id]?.status;
    return status !== undefined && status !== 'unverified';
  }).length;
  const priorityItems = CHECK_ITEMS.filter(item => FIELD_ITEM_IDS.includes(item.id as (typeof FIELD_ITEM_IDS)[number]));
  const otherItems = CHECK_ITEMS.filter(item => !FIELD_ITEM_IDS.includes(item.id as (typeof FIELD_ITEM_IDS)[number]));
  const returnTo = `/ck/transfer?candidate=${candidate.id}`;
  // 체크는 자동 저장되므로 '뒤로가기'는 바로 이전 화면으로 돌아간다. 이전 기록이 없으면 내가 본 집으로.
  const onGoBack = () => { if (window.history.state?.zipsinCheckScreen && window.history.length > 1) window.history.back(); else onFinish(); };

  return <main className={styles.flow}>
    <header className={styles.fieldHeader}><button type="button" onClick={onBack}>내가 본 집</button><div><h1>{candidate.alias} 체크</h1><span aria-live="polite">✓ {completed}/{CHECK_ITEMS.length} 확인 · 자동 저장됨</span></div>{onEdit ? <button type="button" className={styles.editInfo} onClick={onEdit}>이름·위치 수정</button> : <span />}</header>
    <aside className={styles.fieldGuide}><span>★ 모든 항목을 다 확인하지 못해도 괜찮아요. 상세 체크와 메모·사진도 눌러보세요.</span></aside>
    <nav className={styles.flowTabs} aria-label="체크 종류">
      <button type="button" aria-pressed={view === 'checks'} onClick={() => setView('checks')}><Home aria-hidden="true" size={17} />집 체크</button>
      <button type="button" className={styles.questionTab} data-visited={questionsVisited ? 'true' : 'false'} aria-pressed={view === 'questions'} onClick={() => { setView('questions'); setQuestionsVisited(true); }}><MessageCircleQuestion aria-hidden="true" size={17} />질문 체크</button>
    </nav>
    {view === 'checks' ? <>
      <section className={styles.prioritySection} aria-label="집 체크"><div className={styles.sectionHeading}><span>먼저 볼 것</span><h2>집 체크</h2><p>시간이 없으면 이 세 가지만 먼저 확인하세요.</p></div><div className={styles.fieldList}>{priorityItems.map(item => <Row key={item.id} item={item} candidate={candidate} onChange={onChange} store={photoStore} detailSeen={hasSeenDetail(item.id)} onDetailSeen={markDetailSeen} />)}</div></section>
      <section className={styles.otherSection} aria-label="전체 현장 체크"><div className={styles.sectionHeading}><span>더 확인할 것</span><h2>여유가 있으면 더 보기</h2><p>필요한 것만 골라 확인하고, 못 본 항목은 그대로 두세요.</p></div><div className={styles.fieldList}>{otherItems.map(item => <Row key={item.id} item={item} candidate={candidate} onChange={onChange} store={photoStore} detailSeen={hasSeenDetail(item.id)} onDetailSeen={markDetailSeen} />)}</div></section>
    </> : <section className={styles.questionSection} aria-label="집 보러 가서 물어볼 것"><div className={styles.sectionHeading}><span>순서대로 물어보기</span><h3>집 보러 가서 물어볼 것</h3><p>비용과 수리 약속부터 차례로 묻고, 바로 답변을 기록하세요.</p></div><div className={styles.fieldList}>{ASK_ITEMS.map((item, index) => <Row key={item.id} item={item} candidate={candidate} onChange={onChange} store={photoStore} questionIndex={index + 1} detailSeen={hasSeenDetail(item.id)} onDetailSeen={markDetailSeen} />)}</div></section>}
    <div className={styles.stickyFinish}><span><b>{completed}개 체크됨</b><em>{canSaveToAccount ? <>📱 <strong>이 휴대폰에 자동 저장됨</strong></> : '이 화면을 벗어나면 기록이 사라질 수 있어요'}</em></span><div><button type="button" onClick={onGoBack}>뒤로가기</button><button type="button" className={styles.saveOpen} onClick={() => setSaveOpen(true)}>집신 저장</button></div></div>
    {saveOpen && <SaveChoiceSheet accountHref={`/login?next=${encodeURIComponent(returnTo)}`} canSaveToAccount={canSaveToAccount} onAccount={onSaveToAccount} onKeepLocal={() => {setSaveOpen(false); onFinish();}} onClose={() => setSaveOpen(false)} />}
  </main>;
}
