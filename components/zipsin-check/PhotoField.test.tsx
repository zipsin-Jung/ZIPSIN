import '@testing-library/jest-dom/vitest';
import {cleanup, fireEvent, render, screen, waitFor} from '@testing-library/react';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {PhotoStore, StoredPhoto} from '@/lib/zipsin-check/photo-store';
import PhotoField from './PhotoField';

const candidateId = 'candidate-a';
const itemId = 'moisture';

function memoryStore(initial?: StoredPhoto) {
  let saved = initial;
  const store: PhotoStore = {
    get: vi.fn(async () => saved),
    put: vi.fn(async (photo) => { saved = photo; }),
    count: vi.fn(async () => saved ? 1 : 0),
    remove: vi.fn(async () => { saved = undefined; }),
    removeCandidate: vi.fn(async () => { saved = undefined; }),
  };
  return store;
}

beforeEach(() => {
  vi.stubGlobal('createImageBitmap', vi.fn(async () => ({width: 2000, height: 1000, close: vi.fn()})));
  vi.stubGlobal('URL', {...URL, createObjectURL: vi.fn(() => 'blob:preview'), revokeObjectURL: vi.fn()});
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({drawImage: vi.fn()} as unknown as CanvasRenderingContext2D);
  vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => callback(new Blob(['photo'], {type: 'image/jpeg'})));
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe('현장 사진 입력', () => {
  it('사진을 재인코딩해 후보와 항목에 저장하고 썸네일을 보여준다', async () => {
    const store = memoryStore();
    render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={store}/>);
    const input = screen.getByLabelText('습기·곰팡이 사진 추가');

    fireEvent.change(input, {target: {files: [new File(['raw'], 'room.png', {type: 'image/png'})]}});

    expect(await screen.findByRole('status')).toHaveTextContent('이 기기에 사진을 저장했어요');
    expect(store.put).toHaveBeenCalledWith(expect.objectContaining({candidateId, itemId, mime: 'image/jpeg'}));
    expect(await screen.findByRole('img', {name: '습기·곰팡이 현장 사진'})).toBeInTheDocument();
  });

  it('지원하지 않는 사진은 기존 체크와 분리해 거부한다', async () => {
    const store = memoryStore();
    render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={store}/>);
    fireEvent.change(screen.getByLabelText('습기·곰팡이 사진 추가'), {target: {files: [new File(['raw'], 'room.heic', {type: 'image/heic'})]}});

    expect(await screen.findByRole('alert')).toHaveTextContent(/JPG, PNG, WebP/);
    expect(store.put).not.toHaveBeenCalled();
  });

  it('저장된 사진을 다시 불러오고 화면을 닫을 때 미리보기를 정리한다', async () => {
    const photo: StoredPhoto = {id: `${candidateId}::${itemId}`, candidateId, itemId, blob: new Blob(['saved'], {type: 'image/jpeg'}), mime: 'image/jpeg', bytes: 5, createdAt: '2026-10-13T00:00:00.000Z'};
    const {unmount} = render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={memoryStore(photo)}/>);
    await waitFor(() => expect(screen.getByRole('img')).toBeInTheDocument());
    unmount();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('저장 실패를 성공으로 표시하지 않고 기존 입력을 유지한다', async () => {
    const store = memoryStore();
    vi.mocked(store.put).mockRejectedValueOnce(new Error('브라우저 용량이 부족해요.'));
    render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={store}/>);
    fireEvent.change(screen.getByLabelText('습기·곰팡이 사진 추가'), {target: {files: [new File(['raw'], 'room.png', {type: 'image/png'})]}});
    expect(await screen.findByRole('alert')).toHaveTextContent('브라우저 용량이 부족해요');
    await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument());
  });

  it('10MB를 넘는 사진은 저장 전에 안내한다', async () => {
    const store = memoryStore();
    render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={store}/>);
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], 'large.png', {type: 'image/png'});
    fireEvent.change(screen.getByLabelText('습기·곰팡이 사진 추가'), {target: {files: [large]}});
    expect(await screen.findByRole('alert')).toHaveTextContent('10MB 이하');
    expect(store.put).not.toHaveBeenCalled();
  });

  it('사용자 확인 뒤 저장된 사진을 제거한다', async () => {
    const photo: StoredPhoto = {id: `${candidateId}::${itemId}`, candidateId, itemId, blob: new Blob(['saved'], {type: 'image/jpeg'}), mime: 'image/jpeg', bytes: 5, createdAt: '2026-10-13T00:00:00.000Z'};
    const store = memoryStore(photo);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<PhotoField candidateId={candidateId} itemId={itemId} itemTitle="습기·곰팡이" store={store}/>);
    fireEvent.click(await screen.findByRole('button', {name: '습기·곰팡이 사진 제거'}));
    expect(await screen.findByRole('status')).toHaveTextContent('사진을 삭제했어요');
    expect(store.remove).toHaveBeenCalledWith(candidateId, itemId);
    await waitFor(() => expect(screen.queryByRole('img')).not.toBeInTheDocument());
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('습기·곰팡이 사진'));
  });

  it('여러 항목의 사진 제거 버튼을 항목명으로 구분한다', async () => {
    const first: StoredPhoto = {id: `${candidateId}::moisture`, candidateId, itemId: 'moisture', blob: new Blob(['a'], {type: 'image/jpeg'}), mime: 'image/jpeg', bytes: 1, createdAt: ''};
    const second: StoredPhoto = {id: `${candidateId}::noise`, candidateId, itemId: 'noise', blob: new Blob(['b'], {type: 'image/jpeg'}), mime: 'image/jpeg', bytes: 1, createdAt: ''};
    render(<>
      <PhotoField candidateId={candidateId} itemId="moisture" itemTitle="습기·곰팡이" store={memoryStore(first)}/>
      <PhotoField candidateId={candidateId} itemId="noise" itemTitle="소음" store={memoryStore(second)}/>
    </>);
    expect(await screen.findByRole('button', {name: '습기·곰팡이 사진 제거'})).toBeInTheDocument();
    expect(await screen.findByRole('button', {name: '소음 사진 제거'})).toBeInTheDocument();
  });

  it('새 항목에 대응하는 이전 사진을 모두 보여준다', async () => {
    const legacy=['moisture','bathroom-detail','pests'].map((legacyId,index):StoredPhoto=>({id:`${candidateId}::${legacyId}`,candidateId,itemId:legacyId,blob:new Blob([String(index)],{type:'image/jpeg'}),mime:'image/jpeg',bytes:1,createdAt:''}));
    const store:PhotoStore={get:vi.fn(async(_,requested)=>legacy.find(photo=>photo.itemId===requested)),put:vi.fn(async()=>undefined),count:vi.fn(async()=>3),remove:vi.fn(async()=>undefined),removeCandidate:vi.fn(async()=>undefined)};
    render(<PhotoField candidateId={candidateId} itemId="moisture-leak" itemTitle="곰팡이·누수" store={store}/>);
    expect(await screen.findAllByRole('img',{name:/곰팡이·누수 현장 사진/})).toHaveLength(3);
    expect(screen.getAllByRole('button',{name:/곰팡이·누수 사진 [123] 제거/})).toHaveLength(3);
  });
});
