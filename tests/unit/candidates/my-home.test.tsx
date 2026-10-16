import '@testing-library/jest-dom/vitest';
import {render,screen,within} from '@testing-library/react';
import {describe,expect,it} from 'vitest';
import MyHome from '@/components/candidates/MyHome';
import type {CandidateDraftSummary} from '@/features/candidates/server/service';

const summary=(checked:number,problems:number,asked:number)=>({checked,checkTotal:9,problems,asked,askTotal:8});
const homes:CandidateDraftSummary[]=[
  {id:'c1',alias:'성수역 집',listing:{location:'성수역 근처'},terms:{},createdAt:'2026-10-16T01:00:00.000Z',photoCount:2,summary:summary(3,1,2)},
  {id:'c2',alias:'건대 원룸',listing:{},terms:{},createdAt:'2026-10-15T01:00:00.000Z',photoCount:5,summary:summary(7,0,8)},
];

describe('TEST-MYHOME-001 집신 저장 후 마이 홈',()=>{
  it('방금 저장했으면 완료 알림과 보관 안내를 보여준다',()=>{
    render(<MyHome candidates={homes} saved/>);
    expect(screen.getByRole('status')).toHaveTextContent('집신에 저장했어요');
    expect(screen.getByRole('heading',{name:'마이 홈'})).toBeInTheDocument();
    expect(screen.getByText('집신에 안전하게 보관 중')).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'저장한 집 2채'})).toBeInTheDocument();
  });

  it('카드마다 숫자를 보여주고 상세로 연결한다',()=>{
    render(<MyHome candidates={homes} saved={false}/>);
    expect(screen.queryByRole('status')).toBeNull();
    const card=screen.getByRole('link',{name:/성수역 집/});
    expect(card).toHaveAttribute('href','/my/candidates/c1');
    expect(within(card).getByText('3/9')).toBeInTheDocument();
    expect(within(card).getByLabelText('문제 1개')).toBeInTheDocument();
    expect(within(card).getByText('2/8')).toBeInTheDocument();
    expect(within(card).getByLabelText('사진 2장')).toBeInTheDocument();
    expect(within(screen.getByRole('link',{name:/건대 원룸/})).getByText('위치 미입력')).toBeInTheDocument();
  });

  it('다음 단계: 비교·다른 집 체크로 연결하고 준비 중 기능은 누를 수 없게 한다',()=>{
    render(<MyHome candidates={homes} saved={false}/>);
    const next=screen.getByRole('region',{name:'다음 단계'});
    expect(within(next).getByRole('link',{name:/2채 비교하고 고르기/})).toHaveAttribute('href','/ck');
    expect(within(next).getByRole('link',{name:/다른 집 체크하기/})).toHaveAttribute('href','/ck');
    expect(within(next).queryByRole('link',{name:/계약하면/})).toBeNull();
    expect(within(next).getByText('준비 중')).toBeInTheDocument();
  });

  it('저장한 집이 없으면 집신 체크 시작을 안내한다',()=>{
    render(<MyHome candidates={[]} saved={false}/>);
    expect(screen.getByRole('link',{name:'집신 체크 시작'})).toHaveAttribute('href','/ck');
  });
});
