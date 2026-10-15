import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import type {LocalTransferManifest} from '@/features/check-transfer/domain/types';
import TransferPreview from './TransferPreview';

afterEach(cleanup);
const manifest:LocalTransferManifest={schemaVersion:1,requestKey:'request-123',createdAt:'2026-10-13T00:00:00.000Z',expected:{candidates:1,answers:1,photos:1},warnings:['담당자 연락처가 포함되어 있어요.'],candidates:[{localCandidateId:'c1',alias:'햇살 집',listing:{location:'성수동'},terms:{monthlyRentWon:700000},contact:{name:'김중개'},commute:{minutes:25},answers:[{itemId:'water-drain',answer:{status:'confirmed',source:'observed',memo:'수압 좋음'}}],photos:[{id:'p1',candidateId:'c1',itemId:'water-drain',mime:'image/jpeg',bytes:10,blob:new Blob(['photo'])}]}]};

describe('기록 이전 미리보기',()=>{
  it('옮길 자료와 본인 공개 범위를 한눈에 보인다',()=>{
    render(<TransferPreview manifest={manifest} onContinue={vi.fn()}/>);
    expect(screen.getByText(/현재는 나만 볼 수 있어요/)).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'햇살 집'})).toBeInTheDocument();
    expect(screen.getByText(/성수동/)).toBeInTheDocument();
    expect(screen.getByText(/체크 1개 · 사진 1장/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('담당자 연락처');
  });
  it('사진 제외와 필수 동의를 반영한다',()=>{
    const onContinue=vi.fn();render(<TransferPreview manifest={manifest} onContinue={onContinue}/>);
    fireEvent.click(screen.getByRole('checkbox',{name:/사진 1 포함/}));
    fireEvent.click(screen.getByRole('button',{name:'선택한 기록 저장'}));
    expect(onContinue).not.toHaveBeenCalled();
    expect(screen.getByText('기록 이전 동의가 필요해요.')).toHaveAttribute('role','alert');
    fireEvent.click(screen.getByRole('checkbox',{name:/내 계정에 저장/}));
    fireEvent.click(screen.getByRole('button',{name:'선택한 기록 저장'}));
    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({excludedPhotoIds:['p1']}));
  });
});
