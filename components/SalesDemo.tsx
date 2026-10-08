'use client';

import {useEffect, useRef, useState} from 'react';
import Link from 'next/link';
import {
  ArrowLeft, ArrowRight, Building2, CalendarClock, Check, ChevronRight,
  ClipboardCheck, Clock3, FileText, Home, RotateCcw, ShieldCheck, UserRound,
  Users, Wrench,
} from 'lucide-react';
import Brand from './Brand';
import {Button} from './ui/button';
import {
  changeAssignee, changeStatus, demoCase, initialDemoState, nextAction,
  type DemoRole, type DemoState, type DemoView, type IncidentStatus,
} from '@/lib/demo-state';

const statuses: IncidentStatus[] = ['접수', '처리 중', '완료'];
const viewOrder: DemoView[] = ['dashboard', 'house', 'incident', 'handover', 'summary'];
const viewNames: Record<DemoView, string> = {
  start: '안내', dashboard: '오늘의 업무', house: '집 기록', incident: '사건 처리',
  handover: '인수인계', summary: '기록 요약',
};

function DemoHeader({state, setState}:{state:DemoState;setState:React.Dispatch<React.SetStateAction<DemoState>>}) {
  const selectRole = (role:DemoRole) => setState(s => ({...s, role, notice: role === 'manager' ? '대표는 사무소 전체 업무를 봅니다.' : '보조원은 배정된 업무를 우선 봅니다.'}));
  return <>
    <header className="sales-demo-header">
      <Link href="/" aria-label="집신 랜딩페이지로 이동"><Brand/></Link>
      <div className="demo-role-switch" aria-label="데모 역할 선택">
        <button aria-pressed={state.role==='manager'} onClick={()=>selectRole('manager')}>대표</button>
        <button aria-pressed={state.role==='assistant'} onClick={()=>selectRole('assistant')}>보조원</button>
      </div>
      <button className="demo-reset" onClick={()=>setState(initialDemoState)}><RotateCcw/>처음부터</button>
    </header>
    <div className="demo-fixed-notice"><ShieldCheck/>가상 자료이며 저장·전송되지 않습니다.</div>
  </>;
}

function DemoNav({view,onMove}:{view:DemoView;onMove:(view:DemoView)=>void}) {
  return <nav className="sales-demo-nav" aria-label="데모 진행 단계">
    {viewOrder.map((item,index)=><button key={item} aria-current={view===item?'step':undefined} onClick={()=>onMove(item)}><span>{index+1}</span>{viewNames[item]}</button>)}
  </nav>;
}

function Start({onStart}:{onStart:()=>void}) {
  return <main className="demo-start">
    <div className="demo-start-notice"><ShieldCheck/>가상 자료이며 저장·전송되지 않습니다.</div>
    <span className="demo-kicker">공인중개사 3분 데모</span>
    <h1>담당자가 바뀌어도<br/>집의 업무는 이어집니다.</h1>
    <p>가상 누수 사례를 따라가며 오늘 할 일, 집 기록, 담당 변경과 인수인계를 직접 눌러보세요.</p>
    <div className="demo-start-card">
      <Building2/>
      <div><b>{demoCase.office}</b><span>{demoCase.house} · {demoCase.incident}</span></div>
    </div>
    <ul className="demo-safe-list">
      <li><Check/>실제 개인정보를 입력하지 않습니다.</li>
      <li><Check/>클릭한 내용은 저장하거나 전송하지 않습니다.</li>
      <li><Check/>모든 이름·주소·문서는 가상 예시입니다.</li>
    </ul>
    <Button className="demo-primary" onClick={onStart}>데모 시작하기 <ArrowRight/></Button>
    <Link className="demo-home-link" href="/"><ArrowLeft/>랜딩페이지로 돌아가기</Link>
  </main>;
}

function Dashboard({state,onOpen}:{state:DemoState;onOpen:()=>void}) {
  const manager = state.role === 'manager';
  return <section className="demo-panel">
    <span className="demo-kicker">{manager?'대표 공인중개사':'최보조'} 화면</span>
    <h1>{manager?'사무소 전체에서 멈춘 일을 확인하세요.':'내게 배정된 다음 일을 확인하세요.'}</h1>
    <p className="demo-lead">{manager?'전체 집 18채의 업무 우선순위입니다.':'담당 집 6채 중 오늘 처리할 업무입니다.'}</p>
    <div className="demo-metrics">
      <div><Clock3/><span>오늘 할 일</span><b>{manager?'5':'2'}건</b></div>
      <div><Users/><span>답변 대기</span><b>{manager?'3':'1'}건</b></div>
      <div><CalendarClock/><span>기한 초과</span><b>{manager?'1':'0'}건</b></div>
    </div>
    <h2>{manager?'멈춘 집':'내 다음 업무'}</h2>
    <button className="demo-work-card" onClick={onOpen}>
      <span className="demo-state-badge">광고 전 확인 필요</span>
      <strong>{demoCase.house}</strong><span>{demoCase.incident}</span>
      <small>담당 {state.assignee} · {nextAction(state.status)}</small><ChevronRight/>
    </button>
  </section>;
}

function HouseView({state,onOpen}:{state:DemoState;onOpen:()=>void}) {
  return <section className="demo-panel">
    <span className="demo-kicker">집 중심 기록</span><h1>{demoCase.house}</h1>
    <div className="demo-house-summary"><div><Home/><span>현재 상태</span><b>공실 · 광고 준비 중</b></div><div><UserRound/><span>담당자</span><b>{state.assignee}</b></div><div><Wrench/><span>진행 사건</span><b>{demoCase.incident}</b></div></div>
    <div className="demo-next"><span>다음 행동</span><strong>{nextAction(state.status)}</strong><small>{demoCase.schedule}</small></div>
    <p className="demo-principle">수리는 집에서 발생하는 여러 사건 중 하나입니다. 계약·입주·점검·퇴거 기록도 같은 집에 이어집니다.</p>
    <h2>최근 타임라인</h2><div className="demo-timeline">{demoCase.timeline.map(([time,text])=><div key={time+text}><time>{time}</time><p>{text}</p></div>)}</div>
    <Button className="demo-primary" onClick={onOpen}>누수 사건 열기 <ArrowRight/></Button>
  </section>;
}

function IncidentView({state,setState,onNext}:{state:DemoState;setState:React.Dispatch<React.SetStateAction<DemoState>>;onNext:()=>void}) {
  return <section className="demo-panel">
    <span className="demo-kicker">사건 상세</span><h1>{demoCase.incident}</h1><p className="demo-lead">{demoCase.house} · 담당 {state.assignee}</p>
    <div className="demo-statuses" aria-label="처리 상태">{statuses.map(status=><button key={status} aria-pressed={state.status===status} onClick={()=>setState(s=>changeStatus(s,status))}><span>{status==='완료'?<Check/>:statuses.indexOf(status)+1}</span>{status}</button>)}</div>
    <div className="demo-next"><span>현재 다음 행동</span><strong>{nextAction(state.status)}</strong></div>
    <div className="demo-evidence"><div><span>수리 전</span><b>세면대 아래 누수 사진</b><small>가상 사진 2장</small></div><div className={state.status==='완료'?'available':'locked'}><span>수리 후</span><b>{state.status==='완료'?'누수 보수 완료 사진':'완료 시 표시'}</b><small>{state.status==='완료'?'가상 사진 2장':'아직 연결되지 않음'}</small></div><div className={state.status==='완료'?'available':'locked'}><span>영수증</span><b>{state.status==='완료'?'수리 영수증 예시':'완료 시 표시'}</b><small>실제 계좌정보 없음</small></div></div>
    {state.role==='manager'?<div className="demo-assignee"><div><span>현재 담당</span><strong>{state.assignee}</strong></div><Button variant="outline" onClick={()=>setState(s=>changeAssignee(s,s.assignee==='박보조'?'최보조':'박보조'))}>{state.assignee==='박보조'?'최보조에게 넘기기':'박보조로 되돌리기'}</Button></div>:<p className="demo-permission">보조원은 담당자를 변경할 수 없습니다. 대표가 변경한 업무를 이어서 처리합니다.</p>}
    <Button className="demo-primary" onClick={onNext}>인수인계 확인 <ArrowRight/></Button>
  </section>;
}

export function Handover({state,setState,onNext}:{state:DemoState;setState:React.Dispatch<React.SetStateAction<DemoState>>;onNext:()=>void}) {
  const assigned = state.assignee==='최보조';
  const canReassign = state.role==='manager' && !assigned;
  return <section className="demo-panel">
    <span className="demo-kicker">업무 인수인계</span><h1>{assigned?'최보조가 바로 이어서 봅니다.':'먼저 담당자를 최보조로 변경해보세요.'}</h1>
    {canReassign&&<Button className="demo-primary" onClick={()=>setState(s=>changeAssignee(s,'최보조'))}>최보조에게 담당 넘기기</Button>}
    {!assigned&&state.role==='assistant'&&<p className="demo-permission">담당자 변경은 대표만 할 수 있습니다. 대표 화면으로 전환해 담당자를 변경해 주세요.</p>}
    <div className="demo-handover-grid"><article><Check/><span>완료한 일</span><b>현장 확인·수리 전 사진</b></article><article><Clock3/><span>답변 대기</span><b>임대인 완료 확인</b></article><article><FileText/><span>최근 기록</span><b>기사 방문 일정 등록</b></article><article><ClipboardCheck/><span>다음 행동</span><b>{nextAction(state.status)}</b></article></div>
    <div className="demo-access-note"><ShieldCheck/><p><b>기록은 사무소와 집에 남습니다.</b>기존 담당자의 접근 종료는 실제 계정 기능이 아닌 설명용 예시입니다.</p></div>
    <Button variant="outline" className="demo-wide" onClick={()=>setState(s=>({...s,role:'assistant',notice:'최보조 화면으로 전환했습니다. 집의 맥락과 다음 행동이 그대로 이어집니다.'}))}>최보조 화면으로 전환</Button>
    <Button className="demo-primary" onClick={onNext}>기록 요약 보기 <ArrowRight/></Button>
  </section>;
}

function Summary({state}:{state:DemoState}) {
  return <section className="demo-panel">
    <span className="demo-kicker">기록 요약</span><h1>이 집의 업무가 한 장으로 이어집니다.</h1>
    <div className="demo-pdf"><div className="demo-pdf-head"><Brand/><span>PDF 미리보기 예시</span></div><h2>{demoCase.house}</h2><p>{demoCase.incident} · {state.status} · 담당 {state.assignee}</p>{demoCase.timeline.map(([time,text])=><div className="demo-pdf-row" key={time}><b>{time}</b><span>{text}</span></div>)}<div className="demo-pdf-row"><b>현재</b><span>{nextAction(state.status)}</span></div><small>개인정보·연락처·계좌정보는 기본 제외된 가상 예시입니다.</small></div>
    <div className="demo-legal"><ShieldCheck/><p>이 화면은 다운로드되지 않는 미리보기입니다. 기록 정리를 돕지만 법적 증거 효력을 보장하지 않습니다.</p></div>
    <div className="demo-finish"><h2>3분 데모를 마쳤습니다.</h2><p>상담은 아직 전송되지 않습니다. 랜딩페이지에서 집신의 전체 설명과 예상 요금제를 확인하세요.</p><Button asChild className="demo-primary"><Link href="/#signup">랜딩페이지로 돌아가기 <ArrowRight/></Link></Button></div>
  </section>;
}

export default function SalesDemo() {
  const [state,setState] = useState<DemoState>(initialDemoState);
  const mainRef = useRef<HTMLElement>(null);
  const move = (view:DemoView) => setState(s=>({...s,view,notice:''}));
  useEffect(() => {
    if (state.view !== 'start') mainRef.current?.focus();
  }, [state.view]);
  if (state.view==='start') return <div className="sales-demo"><Start onStart={()=>move('dashboard')}/></div>;
  return <div className="sales-demo"><DemoHeader state={state} setState={setState}/><div className="sales-demo-layout"><DemoNav view={state.view} onMove={move}/><main ref={mainRef} tabIndex={-1} className="sales-demo-main" id="demo-main">{state.notice&&<p className="demo-toast" role="status">{state.notice}</p>}{state.view==='dashboard'&&<Dashboard state={state} onOpen={()=>move('house')}/>} {state.view==='house'&&<HouseView state={state} onOpen={()=>move('incident')}/>} {state.view==='incident'&&<IncidentView state={state} setState={setState} onNext={()=>move('handover')}/>} {state.view==='handover'&&<Handover state={state} setState={setState} onNext={()=>move('summary')}/>} {state.view==='summary'&&<Summary state={state}/>}</main></div></div>;
}
