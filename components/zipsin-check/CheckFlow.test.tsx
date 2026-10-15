import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import {createCandidate} from '@/lib/zipsin-check/state';
import type {PhotoStore} from '@/lib/zipsin-check/photo-store';
import CheckFlow from './CheckFlow';

afterEach(cleanup);
const now='2026-10-13T00:00:00.000Z';
const store:PhotoStore={get:vi.fn(async()=>undefined),put:vi.fn(async()=>undefined),count:vi.fn(async()=>0),remove:vi.fn(async()=>undefined),removeCandidate:vi.fn(async()=>undefined)};
const renderFlow=(props:Partial<React.ComponentProps<typeof CheckFlow>>={})=>render(<CheckFlow candidate={createCandidate({id:'a',alias:'A집',depth:'quick',now})} onChange={vi.fn()} onFinish={vi.fn()} onBack={vi.fn()} photoStore={store} {...props}/>);

describe('초보 임차인 현장 체크',()=>{
  it('중요 3개를 상단에 두고 나머지 현장 체크도 모두 제공한다',()=>{
    renderFlow();
    const priority=screen.getByRole('region',{name:'먼저 볼 3개'});
    expect(within(priority).getByRole('heading',{name:'물·배수'})).toBeInTheDocument();
    expect(within(priority).getByRole('heading',{name:'곰팡이·누수'})).toBeInTheDocument();
    expect(within(priority).getByRole('heading',{name:'온수·난방'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'화장실 배수·냄새'})).toBeInTheDocument();
    expect(screen.getByRole('heading',{name:'옵션 상태'})).toBeInTheDocument();
    const more=screen.getByRole('region',{name:'전체 현장 체크'});
    expect(within(more).getAllByRole('heading',{level:2})[1]).toHaveTextContent('옵션 상태');
  });

  it('상세 체크를 처음에는 강조하고 한 번 열면 일반 상태로 바꾼다',()=>{
    renderFlow();
    const detail=screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'});
    expect(detail).toHaveAttribute('data-attention','required');
    expect(detail).toHaveTextContent('상세 체크');
    expect(detail).not.toHaveTextContent('꼭 눌러보세요');
    fireEvent.click(detail);
    fireEvent.click(screen.getByRole('button',{name:'물·배수 상세 체크 접기'}));
    expect(screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'})).toHaveAttribute('data-attention','seen');
    fireEvent.click(screen.getByRole('button',{name:'물어볼 것 8개'}));
    fireEvent.click(screen.getByRole('button',{name:`집 안에서 확인 9개`}));
    expect(screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'})).toHaveAttribute('data-attention','seen');
  });

  it('상태 이름을 문제없음·문제 있음·못 봤음으로 명확하게 표시한다',()=>{
    renderFlow();
    expect(screen.getByRole('button',{name:'물·배수 문제없음'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'물·배수 문제 있음'})).toBeInTheDocument();
    expect(screen.getByRole('button',{name:'물·배수 못 봤음'})).toBeInTheDocument();
    expect(screen.queryByRole('button',{name:/괜찮음/})).not.toBeInTheDocument();
  });

  it('상세 체크에서 정확한 위치·행동·이상 신호를 알려준다',()=>{
    renderFlow();
    fireEvent.click(screen.getByRole('button',{name:'곰팡이·누수 상세 체크 펼치기'}));
    expect(screen.getByRole('checkbox',{name:/천장과 벽이 만나는 위쪽 모서리/})).toBeInTheDocument();
    expect(screen.getByRole('checkbox',{name:/창문 끝·창틀·창문 아래 벽/})).toBeInTheDocument();
    expect(screen.getByText(/검은 점·갈색 물자국/)).toBeInTheDocument();
  });

  it('물어볼 것을 우선순위대로 열고 답변을 메모할 수 있다',()=>{
    renderFlow();
    fireEvent.click(screen.getByRole('button',{name:'물어볼 것 8개'}));
    const questions=screen.getByRole('region',{name:'중개사에게 물어볼 것'});
    expect(within(questions).getAllByRole('heading',{level:2}).map(heading=>heading.textContent)).toEqual([
      '1. 관리비','2. 입주 전 수리','3. 수리 책임','4. 공과금','5. 입주 날짜','6. 주차·자전거','7. 쓰레기','8. 생활 제한',
    ]);
    expect(within(questions).getByRole('button',{name:'관리비 답변 기록'})).toBeInTheDocument();
  });

  it('체크 중 기록을 유지한 채 로그인 페이지로 갈 수 있다',()=>{
    renderFlow();
    expect(screen.getByText('이 기기의 집신체크에 먼저 저장돼요')).toBeInTheDocument();
    expect(screen.getByRole('link',{name:'집신에 저장'})).toHaveAttribute('href','/login?next=%2Fck%2Ftransfer%3Fcandidate%3Da');
  });

  it('완료 버튼은 별도 요약 없이 내가 본 집으로 돌아간다',()=>{
    const onFinish=vi.fn();
    renderFlow({onFinish});
    fireEvent.click(screen.getByRole('button',{name:'저장하고 내가 본 집으로'}));
    expect(onFinish).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button',{name:'체크 결과 보기'})).not.toBeInTheDocument();
  });

  it('상세 행동 체크가 부모 결과를 임의로 바꾸지 않는다',()=>{
    const onChange=vi.fn();renderFlow({onChange});
    fireEvent.click(screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'}));
    fireEvent.click(screen.getByRole('checkbox',{name:/부엌 싱크대와 화장실/}));
    expect(onChange.mock.calls[0][0].answers['water-drain'].status).toBe('unverified');
  });
});
