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
    const priority=screen.getByRole('region',{name:'집 체크'});
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
    fireEvent.click(screen.getByRole('button',{name:'질문 체크'}));
    fireEvent.click(screen.getByRole('button',{name:'집 체크'}));
    expect(screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'})).toHaveAttribute('data-attention','seen');
  });

  it('TEST-CK-STATUS-001 아직 누르지 않은 항목은 세 상태 모두 눌리지 않은 상태로 시작한다',()=>{
    renderFlow();
    for(const name of ['물·배수 문제없음','물·배수 문제 있음','물·배수 못 봤음'])expect(screen.getByRole('button',{name})).toHaveAttribute('aria-pressed','false');
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
    fireEvent.click(screen.getByRole('button',{name:'질문 체크'}));
    const questions=screen.getByRole('region',{name:'집 보러 가서 물어볼 것'});
    expect(within(questions).getAllByRole('heading',{level:2}).map(heading=>heading.textContent)).toEqual([
      '1. 관리비','2. 입주 전 수리','3. 수리 책임','4. 공과금','5. 입주 날짜','6. 주차·자전거','7. 쓰레기','8. 생활 제한',
    ]);
    expect(within(questions).getByRole('button',{name:'관리비 답변 기록'})).toBeInTheDocument();
  });

  it('TEST-CK-SAVE-001 집신 저장을 누르면 두 가지 저장 방법을 고른다',()=>{
    HTMLDialogElement.prototype.showModal=function(){this.setAttribute('open','')};
    HTMLDialogElement.prototype.close=function(){this.removeAttribute('open');this.dispatchEvent(new Event('close'))};
    const onFinish=vi.fn();
    renderFlow({onFinish});
    expect(screen.getByText('이 휴대폰에 자동 저장됨')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'집신 저장'}));
    const sheet=screen.getByRole('dialog',{name:'어디에 저장할까요?'});
    expect(within(sheet).getByRole('link',{name:'로그인하고 저장'})).toHaveAttribute('href','/login?next=%2Fck%2Ftransfer%3Fcandidate%3Da');
    fireEvent.click(within(sheet).getByRole('button',{name:'이대로 두고 내가 본 집으로'}));
    expect(onFinish).toHaveBeenCalledOnce();
  });

  it('TEST-CK-BAR-001 뒤로가기는 이전 기록이 없으면 내가 본 집으로 돌아간다',()=>{
    const onFinish=vi.fn();
    window.history.replaceState(null,'','/ck');
    renderFlow({onFinish});
    fireEvent.click(screen.getByRole('button',{name:'뒤로가기'}));
    expect(onFinish).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button',{name:'체크 결과 보기'})).not.toBeInTheDocument();
  });

  it('상세 행동 체크가 부모 결과를 임의로 바꾸지 않는다',()=>{
    const onChange=vi.fn();renderFlow({onChange});
    fireEvent.click(screen.getByRole('button',{name:'물·배수 상세 체크 펼치기'}));
    fireEvent.click(screen.getByRole('checkbox',{name:/부엌 싱크대와 화장실/}));
    expect(onChange.mock.calls[0][0].answers['water-drain'].status).toBe('unverified');
  });
  it('TEST-CK-TAB-001 질문 체크 탭은 숫자 없이 한 번 열 때까지 강조된다',()=>{
    render(<CheckFlow candidate={createCandidate({id:'tab-test',alias:'탭 집',depth:'quick',now:'2026-10-16T00:00:00.000Z'})} onChange={()=>{}} onFinish={()=>{}} onBack={()=>{}}/>);
    const tab=screen.getByRole('button',{name:'질문 체크'});
    expect(tab).toHaveAttribute('data-visited','false');
    expect(tab).not.toHaveTextContent(/[0-9]/);
    expect(screen.queryByText('중개사에게 꼭')).toBeNull();
    fireEvent.click(tab);
    expect(tab).toHaveAttribute('data-visited','true');
    expect(screen.getByRole('button',{name:'집 체크'})).toHaveAttribute('aria-pressed','false');
  });

  it('TEST-CK-DETAIL-001 질문도 상세 체크처럼 처음엔 빨간 강조, 펼치면 아래 접기로 닫는다',()=>{
    renderFlow();
    fireEvent.click(screen.getByRole('button',{name:'질문 체크'}));
    const toggle=screen.getByRole('button',{name:'관리비 상세 체크 펼치기'});
    expect(toggle).toHaveAttribute('data-attention','required');
    fireEvent.click(toggle);
    expect(screen.getByRole('button',{name:'관리비 상세 체크 접기'})).toHaveAttribute('data-attention','seen');
    fireEvent.click(screen.getByRole('button',{name:'관리비 질문 닫기'}));
    expect(screen.queryByRole('region',{name:'관리비 상세 체크'})).toBeNull();
    expect(screen.queryByText('먼저 볼 3개부터 확인하세요')).toBeNull();
  });
});
