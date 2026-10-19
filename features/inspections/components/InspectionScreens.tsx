import Link from 'next/link';
import { Check, ChevronLeft, ChevronRight, Gauge, KeyRound } from 'lucide-react';
import { AttachmentUploader } from '@/features/attachments/components/AttachmentUploader';
import {
  addItemAction, addRoomAction, createInspectionAction, ensureRoomRecordAction, respondAction, saveReadingsAction, sendInspectionAction, setItemAction,
} from '@/features/inspections/actions/inspection-actions';
import {
  DEFAULT_ROOMS, KIND_LABEL, KIND_PATH, READINGS, STATE_LABEL, inspectionErrorMessage, responseSummary, roomProgress,
  type Aspect, type InspectionItem, type InspectionKind, type InspectionResponse,
} from '@/features/inspections/domain/inspection';
import type { InspectionView } from '@/features/inspections/services/load-inspection';

const day = (iso: string) => new Date(iso).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\s/g, '').replace(/\.$/, '');

function TopBar({ href, label, title }: { href: string; label: string; title: string }) {
  return (
    <div className="flex items-center gap-1">
      <Link aria-label={label} className="-ml-2 grid size-11 place-items-center rounded-lg text-[#212124]" href={href}><ChevronLeft aria-hidden="true" className="size-6" /></Link>
      <h1 className="min-w-0 flex-1 truncate text-[20px] font-bold tracking-[-0.02em] text-[#212124]">{title}</h1>
    </div>
  );
}

function ErrorNote({ code }: { code?: string }) {
  if (!code) return null;
  return <p className="mt-3 rounded-xl bg-[#FDF3F2] px-4 py-3 text-[15px] font-semibold text-[#8C1D18]" role="alert">{inspectionErrorMessage(code)}</p>;
}

function Hidden({ view, kind }: { view: InspectionView; kind: InspectionKind }) {
  return <><input name="homeId" type="hidden" value={view.home.id} /><input name="kind" type="hidden" value={kind} /></>;
}

/** 입주·퇴거 상태 첫 화면: 방 목록 · 계량기 · 보내기 / 임차인 답 요약. */
export function InspectionOverview({ view, kind, error, sent, confirm }: { view: InspectionView; kind: InspectionKind; error?: string; sent?: boolean; confirm?: boolean }) {
  const label = KIND_LABEL[kind];
  const path = `/homes/${view.home.id}/${KIND_PATH[kind]}`;
  const { inspection } = view;
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <TopBar href={`/homes/${view.home.id}`} label="집 화면으로" title={`${label} 상태 기록`} />
      <p className="mt-1 text-[15px] text-[#6B7079]">{view.home.label}</p>
      <ErrorNote code={error} />
      {sent && <p className="mt-3 rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">보냈어요. 임대인·임차인에게 확인 요청 알림이 갔어요.</p>}

      {!view.contractId ? (
        <p className="mt-6 rounded-2xl bg-[#F2F3F6] p-5 text-base leading-7 text-[#4D5159]">이 집에 진행 중인 계약이 없어요. 계약 기간을 등록하면 {label} 상태를 기록할 수 있어요.</p>
      ) : !inspection ? (
        view.isOfficeEditor ? (
          <form action={createInspectionAction} className="mt-5">
            <Hidden kind={kind} view={view} />
            <p className="text-base leading-7 text-[#4D5159]">방마다 항목별로 봤는지 남겨요. 날짜는 자동으로 찍혀요. 세입자 개인 물건은 피해서 찍어 주세요.</p>
            <fieldset className="mt-4">
              <legend className="text-base font-bold text-[#212124]">어떤 방이 있나요?</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {DEFAULT_ROOMS.map((room, index) => (
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-full border border-[#DCDEE3] px-4 text-[15px] has-[:checked]:border-[#0B6655] has-[:checked]:bg-[#E3F0EC] has-[:checked]:font-semibold" key={room}>
                    <input className="size-4 accent-[#0B6655]" defaultChecked={index !== 2 && index !== 6} name="room" type="checkbox" value={room} />{room}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="mt-4 block text-[15px] font-semibold text-[#212124]" htmlFor="extra-rooms">다른 방 (쉼표로 나눠 적기)</label>
            <input className="mt-1 min-h-12 w-full rounded-xl border border-[#DCDEE3] px-4 text-base" id="extra-rooms" maxLength={120} name="extraRooms" placeholder="예: 작은방2, 드레스룸" />
            <button className="app-primary mt-5 min-h-14 w-full rounded-xl text-[17px] font-bold text-white" type="submit">{label} 기록 시작하기</button>
          </form>
        ) : (
          <p className="mt-6 rounded-2xl bg-[#F2F3F6] p-5 text-base leading-7 text-[#4D5159]">사무소가 아직 {label} 상태 기록을 보내지 않았어요. 보내면 알림이 와요.</p>
        )
      ) : (
        <>
          {inspection.status === 'sent' && <p className="mt-3 text-[15px] text-[#4D5159]">{day(inspection.sentAt!)}에 보낸 기록이에요. 보낸 뒤에는 사무소도 고칠 수 없어요.</p>}
          {view.partyRole && inspection.status === 'sent' && <PartySummary items={view.items} responses={view.responses} userId={view.userId} />}
          {kind === 'move_out' && <p className="mt-3 rounded-xl bg-[#F2F3F6] px-4 py-3 text-[15px] text-[#4D5159]">입주 기록과 나란히 보여 줘요. 누가 낼지는 집신이 판단하지 않아요.</p>}
          <ul className="mt-4">
            {view.rooms.map((room) => {
              const progress = roomProgress(view.items, room.id);
              return (
                <li className="border-b border-[#EAEBEE]" key={room.id}>
                  <Link className="flex min-h-[72px] items-center gap-3 py-2" href={`${path}/rooms/${room.id}`}>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[17px] text-[#212124]">{room.name}</strong>
                      <span className="block text-[15px] text-[#6B7079]">항목 {progress.total}개 · 확인 {progress.checked}/{progress.total}{progress.issues ? ` · 이상 ${progress.issues}` : ''}</span>
                    </span>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold ${progress.done ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F2F3F6] text-[#4D5159]'}`}>{progress.done ? '확인 완료' : '아직'}</span>
                    <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
                  </Link>
                </li>
              );
            })}
            <li className="border-b border-[#EAEBEE]">
              <Link className="flex min-h-[64px] items-center gap-3 py-2" href={`${path}/meters`}>
                <Gauge aria-hidden="true" className="size-6 text-[#0B6655]" />
                <span className="flex-1 text-[17px] font-semibold text-[#212124]">계량기 · 열쇠 <span className="text-[15px] font-normal text-[#6B7079]">{view.readings.length}개 기록</span></span>
                <ChevronRight aria-hidden="true" className="size-5 text-[#6B7079]" />
              </Link>
            </li>
          </ul>

          {view.isOfficeEditor && inspection.status === 'draft' && (
            <>
              <form action={addRoomAction} className="mt-4 flex gap-2">
                <Hidden kind={kind} view={view} /><input name="inspectionId" type="hidden" value={inspection.id} />
                <label className="sr-only" htmlFor="new-room">방 더하기</label>
                <input className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#DCDEE3] px-4 text-base" id="new-room" maxLength={30} name="name" placeholder="방 더하기 (예: 드레스룸)" required />
                <button className="min-h-12 shrink-0 rounded-xl border border-[#DCDEE3] px-4 text-base font-semibold" type="submit">더하기</button>
              </form>
              <form action={sendInspectionAction} className="mt-6 rounded-2xl border border-[#EAEBEE] p-4">
                <Hidden kind={kind} view={view} /><input name="inspectionId" type="hidden" value={inspection.id} />
                <label className={`flex min-h-11 items-start gap-2.5 text-[15px] leading-6 ${confirm ? 'font-semibold text-[#8C1D18]' : 'text-[#212124]'}`}>
                  <input className="mt-1 size-[20px] shrink-0 accent-[#0B6655]" name="confirm" type="checkbox" />
                  보내면 사무소도 고칠 수 없어요. 확인 못 한 항목은 &lsquo;확인 못 함&rsquo;으로 그대로 남아요.
                </label>
                <button className="app-primary mt-3 min-h-14 w-full rounded-xl text-[17px] font-bold text-white" type="submit">임대인·임차인에게 확인 요청 보내기</button>
              </form>
            </>
          )}
        </>
      )}
    </main>
  );
}

function PartySummary({ items, responses, userId }: { items: InspectionItem[]; responses: InspectionResponse[]; userId: string }) {
  const summary = responseSummary(items, responses, userId);
  return (
    <section aria-label="내 답" className="mt-4 rounded-2xl bg-[#FBF3E6] p-4">
      <strong className="block text-[15px] text-[#8A5A10]">지금 할 일</strong>
      <p className="mt-0.5 text-[17px] font-bold text-[#212124]">항목마다 맞는지 봐 주세요</p>
      <p className="mt-1 text-[15px] text-[#4D5159]">맞아요 {summary.agreed} · 의견 {summary.commented} · 답 없음 {summary.unanswered}</p>
      <p className="mt-1 text-sm text-[#6B5530]">답하지 않은 항목은 &ldquo;답 없음&rdquo;으로 남아요. 동의한 것으로 보지 않아요.</p>
    </section>
  );
}

type Photo = { id: string; name: string; url: string | null; createdAt: string };

/** 방 화면: 파손 / 청소 나눠 보기, 항목마다 확인함·확인 못 함, 임차인 답. */
export function RoomScreen({ view, kind, roomId, aspect, error, errorItem, photos, before, beforeLabel }: {
  view: InspectionView; kind: InspectionKind; roomId: string; aspect: Aspect; error?: string; errorItem?: string;
  photos: Photo[]; before?: Map<string, InspectionItem | null>; beforeLabel?: string;
}) {
  const room = view.rooms.find((candidate) => candidate.id === roomId)!;
  const inspection = view.inspection!;
  const path = `/homes/${view.home.id}/${KIND_PATH[kind]}`;
  const items = view.items.filter((item) => item.roomId === roomId && item.aspect === aspect).sort((a, b) => a.sortOrder - b.sortOrder);
  const editable = view.isOfficeEditor && inspection.status === 'draft';
  const canRespond = Boolean(view.partyRole) && inspection.status === 'sent';
  const myResponses = new Map(view.responses.filter((response) => response.userId === view.userId).map((response) => [response.itemId, response]));
  const otherResponses = view.responses.filter((response) => response.userId !== view.userId);
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <TopBar href={path} label="방 목록으로" title={`${room.name} · ${KIND_LABEL[kind]} 상태`} />
      <p className="mt-1 text-[15px] text-[#6B7079]">{inspection.sentAt ? `${day(inspection.sentAt)} 보냄` : `${day(inspection.createdAt)} 시작 · 아직 보내지 않음`}</p>
      <nav aria-label="보는 상태" className="mt-4 grid grid-cols-2 rounded-xl bg-[#F2F3F6] p-1">
        {(['damage', 'cleaning'] as const).map((value) => (
          <Link aria-current={aspect === value ? 'page' : undefined} className={`flex min-h-11 items-center justify-center rounded-lg text-[15px] ${aspect === value ? 'bg-white font-bold text-[#212124] shadow-sm' : 'text-[#4D5159]'}`} href={`${path}/rooms/${roomId}?aspect=${value}`} key={value}>
            {value === 'damage' ? '파손 상태' : '청소 상태'}
          </Link>
        ))}
      </nav>
      {error && !errorItem && <ErrorNote code={error} />}

      <ul className="mt-3">
        {items.map((item) => {
          const mine = myResponses.get(item.id);
          const previous = before?.get(item.id);
          return (
            <li className="border-b border-[#EAEBEE] py-4" key={item.id}>
              <div className="flex items-start justify-between gap-3">
                <strong className="text-[17px] text-[#212124]">{item.label}</strong>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-semibold ${item.state === 'issue' ? 'bg-[#FDF3F2] text-[#8C1D18]' : item.state === 'ok' ? 'bg-[#E3F0EC] text-[#083E37]' : 'bg-[#F2F3F6] text-[#4D5159]'}`}>{STATE_LABEL[item.state]}</span>
              </div>
              {item.note && <p className="mt-1 text-[15px] leading-6 text-[#4D5159]">{item.note}</p>}
              {before && <p className="mt-2 rounded-lg bg-[#F2F3F6] px-3 py-2 text-[15px] text-[#4D5159]">{beforeLabel}: {previous ? `${STATE_LABEL[previous.state]}${previous.note ? ` · ${previous.note}` : ''}` : '같은 항목 기록 없음'}</p>}
              {errorItem === item.id && <ErrorNote code={error} />}

              {editable && (
                <form action={setItemAction} className="mt-3 grid gap-2">
                  <Hidden kind={kind} view={view} />
                  <input name="itemId" type="hidden" value={item.id} /><input name="roomId" type="hidden" value={roomId} /><input name="aspect" type="hidden" value={aspect} />
                  <fieldset className="grid grid-cols-3 gap-1.5">
                    <legend className="sr-only">{item.label} 상태</legend>
                    {(['ok', 'issue', 'unchecked'] as const).map((state) => (
                      <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-lg border border-[#DCDEE3] px-1 text-center text-[14px] has-[:checked]:border-[#0B6655] has-[:checked]:bg-[#E3F0EC] has-[:checked]:font-bold" key={state}>
                        <input className="sr-only" defaultChecked={item.state === state} name="state" type="radio" value={state} />
                        {state === 'ok' ? '이상 없음' : state === 'issue' ? '이상 있음' : '확인 못 함'}
                      </label>
                    ))}
                  </fieldset>
                  <label className="sr-only" htmlFor={`note-${item.id}`}>{item.label} 메모</label>
                  <input className="min-h-11 rounded-lg border border-[#DCDEE3] px-3 text-[15px]" defaultValue={item.note ?? ''} id={`note-${item.id}`} maxLength={300} name="note" placeholder="어디가 어떤지 (이상 있음이면 꼭)" />
                  <button className="min-h-11 rounded-lg bg-[#212124] text-[15px] font-semibold text-white" type="submit">저장</button>
                </form>
              )}

              {canRespond && (
                <div className="mt-3">
                  {mine && <p className="mb-2 text-[15px] text-[#083E37]">내 답: {mine.response === 'agree' ? '맞아요' : `의견 · "${mine.comment}"`}</p>}
                  <div className="flex gap-2">
                    <form action={respondAction}>
                      <Hidden kind={kind} view={view} />
                      <input name="itemId" type="hidden" value={item.id} /><input name="roomId" type="hidden" value={roomId} /><input name="aspect" type="hidden" value={aspect} /><input name="response" type="hidden" value="agree" />
                      <button className={`inline-flex min-h-11 items-center gap-1 rounded-lg px-4 text-[15px] font-semibold ${mine?.response === 'agree' ? 'bg-[#0B6655] text-white' : 'border border-[#DCDEE3] text-[#212124]'}`} type="submit"><Check aria-hidden="true" className="size-4" />맞아요</button>
                    </form>
                    <details className="flex-1">
                      <summary className="inline-flex min-h-11 cursor-pointer items-center rounded-lg border border-[#DCDEE3] px-4 text-[15px] font-semibold text-[#212124]">다르면 의견 남기기</summary>
                      <form action={respondAction} className="mt-2 grid gap-2">
                        <Hidden kind={kind} view={view} />
                        <input name="itemId" type="hidden" value={item.id} /><input name="roomId" type="hidden" value={roomId} /><input name="aspect" type="hidden" value={aspect} /><input name="response" type="hidden" value="comment" />
                        <label className="sr-only" htmlFor={`comment-${item.id}`}>{item.label} 의견</label>
                        <textarea className="min-h-20 rounded-lg border border-[#DCDEE3] p-3 text-[15px]" defaultValue={mine?.comment ?? ''} id={`comment-${item.id}`} maxLength={300} name="comment" placeholder="예: 긁힘은 입주 전부터 있었어요" required />
                        <button className="min-h-11 rounded-lg bg-[#212124] text-[15px] font-semibold text-white" type="submit">의견 저장 (원본 옆에 남아요)</button>
                      </form>
                    </details>
                  </div>
                </div>
              )}
              {otherResponses.filter((response) => response.itemId === item.id).map((response) => (
                <p className="mt-2 text-[15px] text-[#4D5159]" key={response.userId}>{response.role === 'tenant' ? '임차인' : '임대인'}: {response.response === 'agree' ? '맞아요' : `의견 · "${response.comment}"`}</p>
              ))}
            </li>
          );
        })}
      </ul>

      {editable && (
        <form action={addItemAction} className="mt-4 flex gap-2">
          <Hidden kind={kind} view={view} /><input name="roomId" type="hidden" value={roomId} /><input name="aspect" type="hidden" value={aspect} />
          <label className="sr-only" htmlFor="new-item">항목 더하기</label>
          <input className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#DCDEE3] px-4 text-base" id="new-item" maxLength={40} name="label" placeholder="항목 더하기 (예: 붙박이장)" required />
          <button className="min-h-12 shrink-0 rounded-xl border border-[#DCDEE3] px-4 text-base font-semibold" type="submit">더하기</button>
        </form>
      )}
      {editable && <p className="mt-3 text-sm text-[#6B7079]">&ldquo;이상 없음&rdquo; 한 번에 체크는 없어요. 항목마다 봤는지 남겨요.</p>}

      <section aria-labelledby="room-photos" className="mt-6">
        <h2 className="text-[17px] font-bold text-[#212124]" id="room-photos">사진 {photos.length}장</h2>
        {photos.length > 0 && (
          <ul className="mt-2 grid grid-cols-3 gap-1.5">
            {photos.map((photo) => (
              <li key={photo.id}>
                {photo.url
                  // eslint-disable-next-line @next/next/no-img-element
                  ? <img alt={`${room.name} 사진 ${photo.name}`} className="aspect-square w-full rounded-lg object-cover" src={photo.url} />
                  : <span className="grid aspect-square place-items-center rounded-lg bg-[#F2F3F6] text-sm text-[#6B7079]">미리보기 없음</span>}
              </li>
            ))}
          </ul>
        )}
        {editable && (room.recordId ? (
          <div className="mt-3"><AttachmentUploader recordId={room.recordId} /></div>
        ) : (
          <form action={ensureRoomRecordAction} className="mt-3">
            <Hidden kind={kind} view={view} /><input name="roomId" type="hidden" value={roomId} />
            <button className="min-h-12 w-full rounded-xl border border-[#DCDEE3] text-base font-semibold" type="submit">이 방 사진 올리기</button>
          </form>
        ))}
        {!editable && photos.length === 0 && <p className="mt-1 text-[15px] text-[#6B7079]">올린 사진이 없어요.</p>}
      </section>
    </main>
  );
}

/** 계량기 · 열쇠 */
export function MetersScreen({ view, kind, error, saved }: { view: InspectionView; kind: InspectionKind; error?: string; saved?: boolean }) {
  const inspection = view.inspection!;
  const editable = view.isOfficeEditor && inspection.status === 'draft';
  const value = (kindValue: string) => view.readings.find((reading) => reading.kind === kindValue)?.value ?? '';
  const groups = [
    { id: 'meter', title: `계량기 (${KIND_LABEL[kind]} 날)`, icon: Gauge },
    { id: 'key', title: '열쇠 · 출입카드', icon: KeyRound },
  ] as const;
  const body = groups.map(({ id, title, icon: Icon }) => (
    <section className="mt-5" key={id}>
      <h2 className="flex items-center gap-2 text-[17px] font-bold text-[#212124]"><Icon aria-hidden="true" className="size-5 text-[#0B6655]" />{title}</h2>
      <ul className="mt-2">
        {READINGS.filter((reading) => reading.group === id).map((reading) => (
          <li className="flex min-h-14 items-center gap-3 border-b border-[#EAEBEE]" key={reading.kind}>
            <label className="w-28 shrink-0 text-base text-[#212124]" htmlFor={`reading-${reading.kind}`}>{reading.label}</label>
            {editable
              ? <input className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#DCDEE3] px-3 text-base" defaultValue={value(reading.kind)} id={`reading-${reading.kind}`} maxLength={60} name={reading.kind} placeholder={reading.placeholder} />
              : <span className="text-base font-semibold text-[#212124]" id={`reading-${reading.kind}`}>{value(reading.kind) || '기록 안 함'}</span>}
          </li>
        ))}
      </ul>
    </section>
  ));
  return (
    <main className="mx-auto max-w-xl px-4 pb-8 pt-3 md:py-8">
      <TopBar href={`/homes/${view.home.id}/${KIND_PATH[kind]}`} label="방 목록으로" title="계량기 · 열쇠" />
      <ErrorNote code={error} />
      {saved && <p className="mt-3 rounded-xl bg-[#E3F0EC] px-4 py-3 text-[15px] font-semibold text-[#083E37]" role="status">저장했어요.</p>}
      {editable ? (
        <form action={saveReadingsAction}>
          <Hidden kind={kind} view={view} /><input name="inspectionId" type="hidden" value={inspection.id} />
          {body}
          <p className="mt-3 text-sm text-[#6B7079]">도어락 비밀번호 숫자는 적지 마세요. 바꿨는지만 남겨요.</p>
          <button className="app-primary mt-5 min-h-14 w-full rounded-xl text-[17px] font-bold text-white" type="submit">저장</button>
        </form>
      ) : body}
    </main>
  );
}
