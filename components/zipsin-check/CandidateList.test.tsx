import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {ASK_ITEMS,CHECK_ITEMS} from '@/lib/zipsin-check/catalog';
import {createCandidateV2} from '@/lib/zipsin-check/state';
import type {CandidateV2} from '@/lib/zipsin-check/types';
import CandidateList from './CandidateList';

afterEach(cleanup);
const make=(id:string,alias:string,createdAt:string,patch:Partial<CandidateV2>={}):CandidateV2=>({...createCandidateV2({id,alias,index:1,now:createdAt,intakeMode:'simple'}),...patch});
const a=make('a','성수역 집','2026-10-16T10:00:00.000Z',{listing:{location:'성수역 근처'},answers:{[CHECK_ITEMS[0].id]:{status:'confirmed',source:'observed'},[CHECK_ITEMS[1].id]:{status:'caution',source:'observed'},[ASK_ITEMS[0].id]:{status:'unverified',source:'observed',memo:'월 8만원'}}});
const b=make('b','건대 원룸','2026-10-15T10:00:00.000Z');
const photoStore={count:vi.fn(async(id:string)=>id==='a'?2:0)} as never;

describe('TEST-CK-LIST-001 로그인 없이 쓰는 내가 본 집',()=>{
  it('이 휴대폰에만 저장된 상태와 집신 저장 방법을 알려준다',()=>{
    render(<CandidateList candidates={[a,b]} onNew={()=>{}} onResume={()=>{}} onDelete={()=>{}}/>);
    const banner=screen.getByRole('region',{name:'이 휴대폰에만 저장돼 있어요'});
    expect(within(banner).getByRole('link',{name:'집신 저장'})).toHaveAttribute('href','/login?next=%2Fck%2Ftransfer');
  });

  it('카드마다 집 체크·문제·질문·사진 숫자를 보여준다',async()=>{
    render(<CandidateList candidates={[a,b]} photoStore={photoStore} onNew={()=>{}} onResume={()=>{}} onDelete={()=>{}}/>);
    const card=screen.getByRole('article',{name:'성수역 집'});
    expect(within(card).getByText(`2/${CHECK_ITEMS.length}`)).toBeInTheDocument();
    expect(within(card).getByLabelText('문제 1개')).toBeInTheDocument();
    expect(within(card).getByText(`1/${ASK_ITEMS.length}`)).toBeInTheDocument();
    expect(await within(card).findByLabelText('사진 2장')).toBeInTheDocument();
  });

  it('다음에 할 일: 2채 이상이면 비교, 가장 최근 집의 남은 질문으로 바로 간다',()=>{
    const onCompare=vi.fn(),onResume=vi.fn();
    render(<CandidateList candidates={[a,b]} onNew={()=>{}} onResume={onResume} onDelete={()=>{}} onCompare={onCompare}/>);
    const next=screen.getByRole('region',{name:'다음에 할 일'});
    fireEvent.click(within(next).getByRole('button',{name:/2채 비교하기/}));
    expect(onCompare).toHaveBeenCalledOnce();
    fireEvent.click(within(next).getByRole('button',{name:new RegExp(`성수역 집 남은 질문 ${ASK_ITEMS.length-1}개`)}));
    expect(onResume).toHaveBeenCalledWith('a','questions');
  });

  it('집이 1채면 비교 대신 다른 집 추가를 권한다',()=>{
    const onNew=vi.fn();
    render(<CandidateList candidates={[b]} onNew={onNew} onResume={()=>{}} onDelete={()=>{}} onCompare={()=>{}}/>);
    const next=screen.getByRole('region',{name:'다음에 할 일'});
    expect(within(next).queryByRole('button',{name:/비교하기/})).toBeNull();
    fireEvent.click(within(next).getByRole('button',{name:/다른 집도 체크하기/}));
    expect(onNew).toHaveBeenCalledOnce();
  });
});
