'use client';

import {useEffect, useMemo, useState} from 'react';
import {FIELD_ITEM_IDS, LEGACY_ITEM_IDS_BY_FIELD} from '@/lib/zipsin-check/catalog';
import {normalizePhone, safeListingUrl} from '@/lib/zipsin-check/contact';
import type {PhotoStore} from '@/lib/zipsin-check/photo-store';
import {buildHomeComparison} from '@/lib/zipsin-check/state';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import ComparePicker from './ComparePicker';
import styles from './ZipsinCheck.module.css';
import {isAccountOpen} from '@/lib/site/account-launch';
import compareStyles from './Compare.module.css';

type PhotoSummary = {count: number; previews: string[]};

export default function CheckCompare({candidates, selectedIds, onToggle, onBack, onEdit, onDelete, onDecide, photoStore}: {
  candidates: CandidateV2[]; selectedIds: string[]; onToggle: (id: string) => void; onBack: () => void;
  onEdit: (id: string) => void; onDelete: (id: string) => void; onDecide?: (id: string) => void; photoStore: PhotoStore;
}) {
  const [showTable, setShowTable] = useState(false);
  const selected = useMemo(() => selectedIds.map((id) => candidates.find((candidate) => candidate.id === id)).filter((candidate): candidate is CandidateV2 => !!candidate), [candidates, selectedIds]);
  const rows = buildHomeComparison(candidates, selectedIds);
  const [photos, setPhotos] = useState<Record<string, PhotoSummary>>({});

  useEffect(() => {
    let active = true;
    const urls: string[] = [];
    Promise.all(selected.map(async (candidate) => {
      const photoItemIds = [...FIELD_ITEM_IDS, ...FIELD_ITEM_IDS.flatMap((id) => LEGACY_ITEM_IDS_BY_FIELD[id])];
      const [count, ...saved] = await Promise.all([photoStore.count(candidate.id), ...photoItemIds.map((itemId) => photoStore.get(candidate.id, itemId))]);
      const previews = saved.filter((photo): photo is NonNullable<typeof photo> => !!photo).map((photo) => URL.createObjectURL(photo.blob));
      urls.push(...previews);
      return [candidate.id, {count, previews}] as const;
    })).then((entries) => {
      if (active) setPhotos(Object.fromEntries(entries)); else urls.forEach((url) => URL.revokeObjectURL(url));
    }).catch(() => { if (active) setPhotos({}); });
    return () => { active = false; urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [photoStore, selected]);

  return <main className={styles.compare}>
    <button type="button" className={styles.back} onClick={onBack}>← 내가 본 집</button>
    <header><p>2~3채를 같은 기준으로</p><h1>집 비교</h1><span>점수나 순위 없이 입력한 사실만 비교해요.</span></header>
    <ComparePicker candidates={candidates} selectedIds={selectedIds} onToggle={(id) => { setShowTable(false); onToggle(id); }} onCompare={() => setShowTable(true)}/>
    {showTable && selected.length >= 2 && <div className={`${styles.tableWrap} ${compareStyles.table}`} style={{maxHeight:'72vh', overflow:'auto'}}><table>
      <thead><tr><th scope="col">항목</th>{selected.map((candidate) => <th scope="col" key={candidate.id}><strong>{candidate.alias}</strong><small>{candidate.listing.location || '위치 미입력'}</small><span className={styles.compareHeadActions}><button type="button" onClick={() => onEdit(candidate.id)} aria-label={`${candidate.alias} 수정`}>수정</button>{onDecide ? <button type="button" className={styles.decideButton} onClick={() => onDecide(candidate.id)} aria-label={`${candidate.alias} 이 집으로 확정`}>이 집으로 확정</button> : null}</span></th>)}</tr></thead>
      <tbody>
        <tr><th scope="row">대표 사진</th>{selected.map((candidate) => <td key={candidate.id}>{photos[candidate.id]?.previews[0] ? <img className={compareStyles.preview} src={photos[candidate.id].previews[0]} alt={`${candidate.alias} 대표 현장 사진`}/> : <span>없음</span>}</td>)}</tr>
        <tr><th scope="row">사진 수</th>{selected.map((candidate) => { const summary = photos[candidate.id]; return <td key={candidate.id}>{summary?.count ?? 0}장{summary?.previews.length ? <details className={compareStyles.photoDetails}><summary aria-label={`${candidate.alias} 사진 ${summary.previews.length}장 모두 보기`}>모두 보기</summary><div className={compareStyles.photoGrid}>{summary.previews.map((preview, index) => <a href={preview} target="_blank" rel="noreferrer" aria-label={`${candidate.alias} 사진 ${index + 1} 크게 보기`} key={preview}><img src={preview} alt=""/></a>)}</div></details> : null}</td>; })}</tr>
        <tr><th scope="row">메모</th>{selected.map((candidate) => { const notes = FIELD_ITEM_IDS.flatMap((id) => candidate.answers[id]?.memo ? [candidate.answers[id].memo] : []); return <td key={candidate.id}>{notes.length ? <details><summary>{notes[0]}</summary><p>{notes.join(' · ')}</p></details> : '없음'}</td>; })}</tr>
        {rows.map((row) => <tr key={row.key}><th scope="row">{row.label}</th>{selected.map((candidate) => <td key={candidate.id} data-status={row.statuses?.[candidate.id]}>{row.values[candidate.id]}</td>)}</tr>)}
        <tr><th scope="row">재연락</th>{selected.map((candidate) => { const phone = normalizePhone(candidate.contact.phone); return <td key={candidate.id}>{phone ? <a href={`tel:${phone}`} aria-label={`${candidate.alias} 전화하기`}>☎ 전화하기</a> : <span>연락처 수정 필요</span>}</td>; })}</tr>
        <tr><th scope="row">매물</th>{selected.map((candidate) => { const url = safeListingUrl(candidate.listing.listingUrl); return <td key={candidate.id}>{url ? <a href={url.href} target="_blank" rel="noreferrer" aria-label={`${candidate.alias} 매물 보기`}>외부 매물 보기</a> : '미입력'}</td>; })}</tr>
        <tr><th scope="row">관리</th>{selected.map((candidate) => <td key={candidate.id}><button type="button" className={compareStyles.delete} onClick={() => onDelete(candidate.id)}>{candidate.alias} 영구 삭제</button></td>)}</tr>
      </tbody>
    </table></div>}
    {showTable && !isAccountOpen() && <div className={`${styles.signupCta} ${styles.preparingCta}`} aria-disabled="true"><strong>집신에 저장하기 · 준비 중</strong><span>곧 열려요. 비교한 집은 이 휴대폰에 그대로 남아요.</span></div>}
    {showTable && isAccountOpen() && <a className={styles.signupCta} href={`/ck/transfer?candidates=${encodeURIComponent(selectedIds.join(','))}`}><strong>집신에 저장하기</strong><span>선택한 집과 사진을 확인한 뒤 내 계정에 옮길 수 있어요.</span></a>}
  </main>;
}
