import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "/Users/zipsin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const ROOT = "/Users/zipsin/Documents/ChatGPT/배포";
const SKILL_DIR = "/Users/zipsin/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const TMP = path.join(ROOT, ".codex-build", "zipsin-numeric-plan");
const OUT = path.join(ROOT, "artifacts", "business-plan", "집신_사업계획서_숫자중심_20장_v2.pptx");
const PY = "/Users/zipsin/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const { resolvePresentationFont, applyPresentationChartFont, finalizePresentation } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
await fs.mkdir(TMP, { recursive: true });
await fs.mkdir(path.dirname(OUT), { recursive: true });
const font = resolvePresentationFont();
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });
const logo = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/zipsin-company-logo.jpg")));
const ui = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/02_zipsin_role_mobile_ui(1).png")));

const C = { green:"#103E33", green2:"#17634E", ivory:"#F6F0E3", paper:"#FFFDF8", gold:"#C79538", ink:"#172E28", gray:"#63716D", pale:"#E4ECE7", orange:"#D26B36", red:"#AA4A3D", white:"#FFFFFF" };
function slide(bg=C.paper){const s=p.slides.add();s.background.fill=bg;return s;}
function box(s,x,y,w,h,fill=C.white,r=12,line="none"){return s.shapes.add({geometry:r?"roundRect":"rect",position:{left:x,top:y,width:w,height:h},fill,line:{fill:line,width:line==="none"?0:1},...(r?{borderRadius:r}:{})});}
function text(s,t,x,y,w,h,z=22,c=C.ink,o={}){const q=s.shapes.add({geometry:"textbox",position:{left:x,top:y,width:w,height:h},fill:"none",line:{fill:"none",width:0}});q.text=t;q.text.style={typeface:font,fontSize:z,color:c,bold:o.bold??false,alignment:o.align??"left",verticalAlignment:o.valign??"top",autoFit:"none"};return q;}
function head(s,t,k=""){if(k)text(s,k.toUpperCase(),64,34,400,24,13,C.gold,{bold:true});text(s,t,64,67,1150,68,36,C.ink,{bold:true});box(s,64,145,52,5,C.gold,0);}
function foot(s,n,state=""){if(state){const f=state==="사실"?C.green2:state==="가설"?C.gold:C.gray;box(s,64,666,82,24,f,12);text(s,state,64,669,82,16,12,C.white,{bold:true,align:"center"});}text(s,String(n).padStart(2,"0"),1160,666,50,18,12,C.gray,{align:"right"});}
function notes(s,t){s.speakerNotes.textFrame.setText(`${t}\n\n기준 자료: /Users/zipsin/Desktop/집신.pdf`);}
function metric(s,x,y,n,label,color=C.green2,w=210){text(s,n,x,y,w,58,42,color,{bold:true,align:"center"});text(s,label,x,y+62,w,46,16,C.gray,{align:"center"});}
function row(s,y,a,b,c,d,shade=false){if(shade)box(s,64,y,1150,55,C.ivory,8);text(s,a,82,y+15,190,30,16,C.green2,{bold:true});text(s,b,285,y+12,280,35,15,C.ink);text(s,c,585,y+12,280,35,15,C.ink);text(s,d,885,y+12,300,35,15,C.gray);}
function chart(s,type,x,y,w,h,cats,series,opts={}){const q=s.charts.add(type,{position:{left:x,top:y,width:w,height:h},categories:cats,series,hasLegend:opts.legend??false,dataLabels:{showValue:true,position:opts.position??"outEnd"},...(opts.barOptions?{barOptions:opts.barOptions}:{})});applyPresentationChartFont(q,{fontFamily:font});return q;}

// 1
{
 const s=slide(C.ivory);s.images.add({blob:logo,contentType:"image/jpeg",alt:"집신 로고",fit:"contain",position:{left:64,top:40,width:62,height:54}});text(s,"한 집의 기록은 많지만\n전체 이력을 보는 곳은 없습니다",64,125,1150,118,42,C.ink,{bold:true});
 const facts=[["1","집"],["3","핵심 관계자"],["5","흩어진 도구"],["0","연결된 타임라인"]];
 facts.forEach((d,i)=>{const x=64+i*290;box(s,x,285,260,150,i===3?C.green:C.white,18,i===3?C.green:C.pale);text(s,d[0],x+18,305,224,62,46,i===3?C.gold:C.green2,{bold:true,align:"center"});text(s,d[1],x+18,375,224,32,18,i===3?C.white:C.gray,{bold:true,align:"center"});});
 box(s,190,500,900,92,C.green,16);text(s,"아하",220,520,80,24,15,C.gold,{bold:true});text(s,"문제는 기록 부족이 아니라 집을 기준으로 연결되지 않는 것입니다",300,517,750,42,22,C.white,{bold:true,align:"center"});
 text(s,"구조 요약: 공인중개사·임대인·임차인 / 전화·메신저·사진첩·PC 폴더·종이 서류",210,620,860,25,14,C.gray,{align:"center"});foot(s,1,"사실");notes(s,"확인되지 않은 조사 퍼센트 대신 제품이 해결하는 구조를 숫자로 요약했습니다.");
}
// 2
{
 const s=slide();head(s,"한 집의 기록을 최소 다섯 가지 도구에서 관리합니다","current state");
 const tools=[["전화·문자","요청과 진행 확인"],["카카오톡","관계자 대화"],["사진첩","광고·입주·수리 사진"],["PC 폴더","계약서·영수증"],["종이 서류","계약·확인 자료"]];
 tools.forEach((d,i)=>{const x=64+i*230;box(s,x,190,205,245,i===4?C.green:C.ivory,18,i===4?C.green:C.pale);text(s,String(i+1),x+18,210,34,30,16,i===4?C.gold:C.green2,{bold:true});text(s,d[0],x+18,260,169,32,21,i===4?C.white:C.ink,{bold:true});text(s,d[1],x+18,325,169,70,16,i===4?C.white:C.gray);});
 text(s,"도구마다 기록은 남지만 집별 전체 상태를 보여주는 곳은 없습니다",180,510,920,40,25,C.green2,{bold:true,align:"center"});text(s,"다음 질문  흩어진 기록이 실제 업무에서 만드는 반복은 무엇인가?",300,580,680,28,16,C.gray,{align:"center"});foot(s,2,"사실");notes(s,"현재 관리 방식의 분산 구조를 정리했습니다.");
}
// 3
{
 const s=slide(C.ivory);head(s,"흩어진 기록은 검색·재확인·재방문을 반복시킵니다","hidden cost");
 const loop=["사진 검색","관계자 연락","상태 재확인","자료 부족","현장 재방문"];
 loop.forEach((t,i)=>{const x=70+i*235;box(s,x,215,200,85,i===4?C.red:C.white,18,C.pale);text(s,t,x+12,240,176,30,19,i===4?C.white:C.ink,{bold:true,align:"center"});if(i<4)text(s,"›",x+205,235,28,40,30,C.gold,{bold:true,align:"center"});});
 text(s,"유료 베타에서 측정할 네 숫자",64,365,500,34,25,C.green2,{bold:true});const ms=[["자료 검색","분"],["반복 연락","회"],["재방문","회/월"],["인수인계","시간"]];ms.forEach((d,i)=>{const x=64+i*286;box(s,x,420,260,110,C.white,14,C.pale);text(s,"측정 전",x+15,440,230,30,24,C.gold,{bold:true,align:"center"});text(s,`${d[0]} · ${d[1]}`,x+15,480,230,26,16,C.gray,{align:"center"});});
 text(s,"시간과 비용 절감률은 현재 가설이며 실제 사용 전에는 단정하지 않습니다",235,575,810,30,17,C.orange,{bold:true,align:"center"});foot(s,3,"가설");notes(s,"시간 절감 수치는 아직 없습니다. 베타에서 기준값과 사용 후 값을 측정합니다.");
}
// 4
{
 const s=slide();head(s,"세 사용자는 같은 집을 서로 다른 방식으로 관리합니다","user matrix");
 text(s,"구분",82,177,180,30,17,C.gray,{bold:true});text(s,"공인중개사무소",285,177,260,30,18,C.green2,{bold:true});text(s,"임대인",585,177,260,30,18,C.green2,{bold:true});text(s,"임차인",885,177,260,30,18,C.green2,{bold:true});
 row(s,220,"현재 도구","개인폰·PC·종이","전화·사진첩","사진첩·메신저",true);row(s,285,"자주 찾는 정보","사진·연락처·진행","공실·수리·비용","입주상태·요청결과");row(s,350,"반복 업무","검색·전달·인수인계","여러 곳에 같은 설명","처리상태 재문의",true);row(s,415,"단절 순간","직원·담당자 변경","중개사 변경","계약 종료");row(s,480,"핵심 손실","업무시간·누락","방문·확인 시간","불확실성·반복 문의",true);
 box(s,64,570,1150,54,C.green,12);text(s,"같은 집을 보지만 사용하는 도구가 달라 서로 다른 정보를 갖게 됩니다",90,585,1100,28,20,C.white,{bold:true,align:"center"});foot(s,4,"사실");notes(s,"공인중개사무소, 임대인, 임차인의 현재 관리 방식을 비교했습니다.");
}
// 5
{
 const s=slide(C.ivory);head(s,"세 사용자는 다른 비용을 줄이기 위해 집신을 사용합니다","value and friction");
 const cols=[["공인중개사무소","검색·인수인계","초기 등록·직원 교육","검색시간·재결제"],["임대인","방문·반복 설명","본인확인·공개 불안","초대수락·상태확인"],["임차인","반복 문의·누락","생활정보 공개 불안","등록률·완료확인"]];
 cols.forEach((d,i)=>{const x=64+i*383;box(s,x,190,355,360,C.white,18,C.pale);text(s,d[0],x+24,220,307,34,23,C.green2,{bold:true});text(s,"얻는 가치",x+24,285,120,25,14,C.gold,{bold:true});text(s,d[1],x+24,317,307,35,19,C.ink,{bold:true});text(s,"도입 부담",x+24,380,120,25,14,C.red,{bold:true});text(s,d[2],x+24,412,307,42,17,C.ink);text(s,"검증 숫자",x+24,480,120,25,14,C.gray,{bold:true});text(s,d[3],x+24,510,307,28,16,C.gray);});
 text(s,"장점만큼 도입 부담도 함께 측정해야 실제 사용 가능성을 판단할 수 있습니다",200,590,880,30,20,C.green2,{bold:true,align:"center"});foot(s,5,"가설");notes(s,"사용자별 가치와 도입 부담을 함께 보여줍니다.");
}
// 6
{
 const s=slide();head(s,"집키가 사진·사람·처리 상태의 공통 기준이 됩니다","house key");
 box(s,455,220,370,195,C.green,90);text(s,"집키",535,260,210,52,42,C.white,{bold:true,align:"center"});text(s,"시스템 자동 생성",535,330,210,28,17,C.gold,{bold:true,align:"center"});
 const a=[["사진",100,225],["수리 상태",90,420],["관계자",955,225],["다음 행동",955,420]];a.forEach(d=>{box(s,d[1],d[2],235,78,C.ivory,18,C.pale);text(s,d[0],d[1]+15,d[2]+25,205,30,19,C.ink,{bold:true,align:"center"});});
 text(s,"기록을 더 만드는 대신 이미 생기는 기록에 집의 주소표를 붙입니다",200,540,880,42,26,C.green2,{bold:true,align:"center"});foot(s,6,"확정");notes(s,"집키는 사용자가 외우는 비밀번호가 아니라 내부 연결 기준입니다.");
}
// 7
{
 const s=slide(C.ivory);head(s,"다섯 번의 재확인이 하나의 집 타임라인으로 바뀝니다","before and after");
 text(s,"현재",70,190,180,32,23,C.red,{bold:true});const before=["검색","다시 연락","상태 확인","사진 요청","별도 저장"];before.forEach((t,i)=>{const x=65+i*230;box(s,x,240,205,72,C.white,14,C.pale);text(s,t,x+10,263,185,25,17,C.ink,{bold:true,align:"center"});});
 text(s,"집신",70,370,180,32,23,C.green2,{bold:true});const after=["집 선택","요청 등록","상태 공유","완료 기록","다음에 재사용"];after.forEach((t,i)=>{const x=65+i*230;box(s,x,420,205,72,i===4?C.green:C.white,14,i===4?C.green:C.pale);text(s,t,x+10,443,185,25,17,i===4?C.white:C.ink,{bold:true,align:"center"});});
 text(s,"측정: 처리시간 · 반복 연락 · 사진 누락 · 검색시간 · 기록 재사용",230,565,820,32,19,C.gold,{bold:true,align:"center"});foot(s,7,"가설");notes(s,"Before/After의 효과는 유료 베타에서 측정합니다.");
}
// 8
{
 const s=slide();head(s,"첫 MVP는 기록 재사용을 확인하는 다섯 기능에 집중합니다","mvp");
 s.images.add({blob:ui,contentType:"image/png",alt:"현재 역할별 모바일 화면 시안",fit:"contain",position:{left:60,top:170,width:530,height:410}});
 const flow=["집 등록","관계자 초대","권한 설정","전후 사진·상태","이전 기록 조회"];flow.forEach((t,i)=>{const y=180+i*80;box(s,670,y,485,58,i===4?C.green:C.ivory,14,i===4?C.green:C.pale);text(s,`${i+1}`,690,y+16,32,25,15,i===4?C.gold:C.green2,{bold:true});text(s,t,740,y+14,385,28,18,i===4?C.white:C.ink,{bold:true});});
 text(s,"후속: OCR · 수리 중개 · 견적 비교 · 앱 결제 · AI 진단",660,595,510,26,15,C.gray,{align:"center"});foot(s,8,"가설");notes(s,"현재 UI는 방향 시안입니다. 수리기사는 작업 참여자이며 핵심 결제 고객은 공인중개사무소입니다.");
}
// 9
{
 const s=slide(C.ivory);head(s,"집의 이력은 이어져도 개인정보는 함께 넘어가지 않습니다","access");
 const roles=["대표","보조원","임대인","임차인","기사"];roles.forEach((r,i)=>text(s,r,300+i*165,180,130,25,16,C.green2,{bold:true,align:"center"}));
 const rr=[["사무소 전체","●","△","-","-","-"],["배정된 집","●","●","●","△","△"],["현재 계약","●","△","●","●","-"],["해당 수리","●","●","●","●","●"],["내부 메모","●","△","-","-","-"],["계좌정보","△","-","△","-","-"]];rr.forEach((r,j)=>{const y=220+j*60;if(j%2===0)box(s,64,y,1150,48,C.white,8);text(s,r[0],82,y+13,190,25,15,C.ink,{bold:true});for(let i=1;i<6;i++)text(s,r[i],300+(i-1)*165,y+12,130,25,17,r[i]==="●"?C.green2:r[i]==="△"?C.gold:C.gray,{bold:true,align:"center"});});
 text(s,"● 전체   △ 제한   - 접근 불가",430,595,420,25,15,C.gray,{align:"center"});foot(s,9,"1차 원칙");notes(s,"세부 권한과 보존 정책은 상세 설계에서 확정합니다.");
}
// 10
{
 const s=slide();head(s,"집신은 계약 이후 관리와 집 중심 연결에 집중합니다","positioning");
 box(s,140,205,930,4,C.gray,0);box(s,602,165,4,400,C.gray,0);text(s,"거래 중심",90,190,120,25,15,C.gray);text(s,"관리 중심",1060,190,120,25,15,C.gray,{align:"right"});text(s,"집 중심 연결",620,160,180,25,15,C.gray);text(s,"분산 기록",620,555,180,25,15,C.gray);
 const points=[["매물 플랫폼",250,395,C.gray],["전자계약",430,335,C.gold],["메신저·사진첩",300,500,C.red],["임대관리",800,360,C.gold],["집신",880,245,C.green2]];points.forEach(d=>{box(s,d[1],d[2],150,52,d[3],14);text(s,d[0],d[1]+8,d[2]+16,134,24,15,C.white,{bold:true,align:"center"});});
 text(s,"1차 가설 비교 · 경쟁사의 최신 기능과 가격은 별도 조사 필요",285,610,710,25,15,C.orange,{bold:true,align:"center"});foot(s,10,"가설");notes(s,"포지셔닝은 1차 가설이며 경쟁사 최신 조사가 필요합니다.");
}
// 11
{
 const s=slide(C.ivory);head(s,"공인중개사무소 한 곳이 여러 집과 관계자를 연결합니다","entry channel");
 metric(s,95,210,"1곳","공인중개사무소",C.green2,200);text(s,"›",305,225,45,40,34,C.gold,{bold:true,align:"center"});metric(s,365,210,"50채","등록 주택 가정",C.gold,200);text(s,"›",575,225,45,40,34,C.gold,{bold:true,align:"center"});metric(s,635,210,"다수","임대인·임차인",C.green2,200);text(s,"›",845,225,45,40,34,C.gold,{bold:true,align:"center"});metric(s,905,210,"필요시","수리기사",C.green2,200);
 box(s,145,400,990,130,C.white,18,C.pale);text(s,"임대인 50명을 한 명씩 모집",180,430,400,35,20,C.gray,{align:"center"});text(s,"대비",590,430,100,35,18,C.gold,{bold:true,align:"center"});text(s,"사무소 1곳에서 50채 연결",700,430,390,35,22,C.green2,{bold:true,align:"center"});text(s,"공인중개사무소는 결제 고객이자 도입 채널입니다",275,575,730,34,24,C.ink,{bold:true,align:"center"});foot(s,11,"가설");notes(s,"사무소당 50채는 목표 가정이며 실제 평균이 아닙니다.");
}
// 12
{
 const s=slide();head(s,"고객은 저장 공간보다 줄어든 업무 시간에 비용을 지불합니다","willingness to pay");
 text(s,"업무",82,180,180,25,16,C.gray,{bold:true});text(s,"현재 비용",285,180,280,25,16,C.gray,{bold:true});text(s,"집신의 변화",585,180,280,25,16,C.gray,{bold:true});text(s,"검증 숫자",885,180,280,25,16,C.gray,{bold:true});
 row(s,220,"자료 검색","직원이 다시 찾음","집별 기록 조회","검색 시간",true);row(s,285,"반복 연락","같은 내용을 재전달","상태 공동 확인","연락 횟수");row(s,350,"현장 재방문","자료 부족으로 방문","전후 사진 확인","재방문 횟수",true);row(s,415,"진행 확인","전화로 상태 확인","상태·담당자 표시","처리 기간");row(s,480,"인수인계","개인폰·구두 설명","다음 행동 전달","인계 시간",true);
 box(s,180,575,920,42,C.green,10);text(s,"절약되는 시간의 가치가 구독료보다 클 때 결제 이유가 생깁니다",200,585,880,25,19,C.white,{bold:true,align:"center"});foot(s,12,"가설");notes(s,"시간 절감과 비용 가치는 베타에서 측정합니다.");
}
// 13
{
 const s=slide(C.ivory);head(s,"월 99,000원은 실제 결제로 검증할 가격 가설입니다","pricing");
 box(s,70,190,430,345,C.green,22);text(s,"BUSINESS",105,225,350,28,17,C.gold,{bold:true});text(s,"월 99,000원",105,285,350,60,43,C.white,{bold:true});text(s,"최대 50채 가정",105,365,350,32,20,C.white);text(s,"출시 전 가격 가설",105,470,250,28,16,C.gold,{bold:true});
 const checks=[["실제 결제","결제 전환"],["4주 사용","주간 활동"],["기록 재사용","집 수"],["재결제 의사","유지율"]];checks.forEach((d,i)=>{const x=590+(i%2)*285,y=205+Math.floor(i/2)*165;box(s,x,y,255,135,C.white,16,C.pale);text(s,d[0],x+20,y+25,215,28,19,C.green2,{bold:true});text(s,d[1],x+20,y+75,215,28,16,C.gray);});
 text(s,"포함 기능·저장량·50채 초과 요금은 미정",615,555,525,28,16,C.orange,{bold:true,align:"center"});foot(s,13,"가설");notes(s,"월 99,000원은 랜딩페이지의 예상 가격이며 실제 결제 전 확정할 수 없습니다.");
}
// 14
{
 const s=slide();head(s,"유료 사무소 20곳은 월 198만원의 첫 매출 가설입니다","revenue scenario");
 chart(s,"bar",80,190,720,360,["5곳","10곳","20곳","50곳"],[{name:"월 구독매출(만원)",values:[49.5,99,198,495],fill:C.green2}],{barOptions:{direction:"column",grouping:"clustered"}});
 box(s,850,205,320,235,C.ivory,20);text(s,"20곳 가정",880,235,260,28,17,C.gray,{bold:true});text(s,"월 198만원",880,290,260,48,33,C.green2,{bold:true});text(s,"연 2,376만원",880,355,260,42,27,C.gold,{bold:true});
 text(s,"99,000원 × 20곳 × 12개월",850,470,320,28,17,C.ink,{bold:true,align:"center"});text(s,"할인·해지·세금·수수료·운영비 미반영",820,530,380,50,15,C.orange,{bold:true,align:"center"});foot(s,14,"가설");notes(s,"단순 산식이며 실제 매출이 아닙니다.");
}
// 15
{
 const s=slide(C.ivory);head(s,"20개 사무소와 50채 가정은 주택 1,000채의 검증 목표입니다","validation scale");
 chart(s,"bar",70,190,760,350,["1곳","5곳","10곳","20곳"],[{name:"등록 주택 목표",values:[50,250,500,1000],fill:C.gold}],{barOptions:{direction:"column",grouping:"clustered"}});
 text(s,"20",900,205,220,65,50,C.green2,{bold:true,align:"center"});text(s,"유료 사무소 목표",900,275,220,28,17,C.gray,{align:"center"});text(s,"× 50",900,345,220,55,40,C.gold,{bold:true,align:"center"});text(s,"사무소당 주택 가정",900,405,220,28,17,C.gray,{align:"center"});text(s,"= 1,000채",860,485,300,58,42,C.green2,{bold:true,align:"center"});text(s,"현재 실적이 아닌 검증 목표",870,555,280,28,16,C.orange,{bold:true,align:"center"});foot(s,15,"목표");notes(s,"중복 없는 주택 1,000채는 목표이며 현재 실적이 아닙니다.");
}
// 16
{
 const s=slide();head(s,"등록 수보다 다음 업무에서 다시 사용된 집 수가 중요합니다","north-star metric");
 box(s,160,430,960,115,C.ivory,18,C.pale);text(s,"가입자 · 사진 · 등록 주택",190,462,900,35,21,C.gray,{bold:true,align:"center"});
 box(s,270,305,740,105,C.pale,18);text(s,"첫 기록 작성 · 관계자 참여",300,338,680,34,23,C.ink,{bold:true,align:"center"});
 box(s,380,170,520,110,C.green,18);text(s,"월간 기록 재사용 집 수",405,200,470,38,28,C.white,{bold:true,align:"center"});text(s,"후속 수리 · 인수인계 · 재계약 · 퇴거",405,246,470,25,15,C.gold,{align:"center"});
 text(s,"기록은 쌓일 때보다 다시 사용될 때 경제적 가치가 생깁니다",220,590,840,32,22,C.green2,{bold:true,align:"center"});foot(s,16,"가설");notes(s,"핵심 지표 후보는 월간 기존 기록을 다음 업무에서 다시 활용한 집 수입니다.");
}
// 17
{
 const s=slide(C.ivory);head(s,"접촉부터 구독 유지까지 여덟 단계로 측정합니다","conversion funnel");
 const f=["접촉","설명","유료 신청","실제 결제","첫 집","첫 기록","재사용","유지"];f.forEach((t,i)=>{const w=1080-i*95,x=100+i*47.5,y=175+i*55;box(s,x,y,w,42,i<3?C.pale:i<6?C.gold:C.green2,8);text(s,`${i+1}  ${t}`,x+20,y+11,w-40,22,15,i<3?C.ink:C.white,{bold:true,align:"center"});});
 text(s,"현재 실제 값 없음 · 각 단계의 전환율과 이탈 이유를 유료 모집에서 기록",190,625,900,28,16,C.orange,{bold:true,align:"center"});foot(s,17,"측정 틀");notes(s,"퍼널 수치는 아직 없으며 실제 모집에서 기록합니다.");
}
// 18
{
 const s=slide();head(s,"월 구독매출에서 변동비와 지원비를 빼야 수익이 보입니다","unit economics");
 box(s,80,190,280,120,C.green,18);text(s,"월 구독매출",100,220,240,28,18,C.gold,{bold:true,align:"center"});text(s,"99,000원 가설",100,260,240,32,23,C.white,{bold:true,align:"center"});
 text(s,"−",375,225,50,60,42,C.gold,{bold:true,align:"center"});box(s,440,190,330,120,C.ivory,18,C.pale);text(s,"변동비",465,220,280,28,18,C.red,{bold:true,align:"center"});text(s,"저장·전송·인증·PDF",465,260,280,28,17,C.ink,{align:"center"});
 text(s,"−",785,225,50,60,42,C.gold,{bold:true,align:"center"});box(s,850,190,330,120,C.ivory,18,C.pale);text(s,"직접 지원비",875,220,280,28,18,C.red,{bold:true,align:"center"});text(s,"등록·교육·고객응대",875,260,280,28,17,C.ink,{align:"center"});
 box(s,225,385,830,105,C.green2,18);text(s,"= 사무소당 월 기여이익",255,415,770,38,27,C.white,{bold:true,align:"center"});text(s,"비용 값은 견적과 베타 측정 후 입력",255,458,770,25,15,C.gold,{align:"center"});
 text(s,"고객 시간을 줄여도 운영자가 모든 사용을 대신하면 지속하기 어렵습니다",190,565,900,35,21,C.ink,{bold:true,align:"center"});foot(s,18,"가설");notes(s,"단위경제 비용은 아직 확인되지 않았습니다.");
}
// 19
{
 const s=slide(C.ivory);head(s,"검증된 집 기록을 활용하는 고객부터 순서대로 확장합니다","expansion");
 const ex=[["1","B2B 중개사","월 구독","결제·재사용"],["2","B2C 임대인","개인 구독","초대·반복사용"],["3","B2B 작업업체","구독·수수료 검토","작업이력 수요"],["4","B2G 공공기관","시범사업 검토","보안·도입절차"]];
 ex.forEach((d,i)=>{const x=65+i*290;box(s,x,195,265,345,i===0?C.green:C.white,18,i===0?C.green:C.pale);text(s,d[0],x+20,220,45,40,28,i===0?C.gold:C.green2,{bold:true});text(s,d[1],x+20,290,225,38,21,i===0?C.white:C.ink,{bold:true});text(s,d[2],x+20,365,225,30,17,i===0?C.white:C.gray);text(s,"진입 조건",x+20,435,225,25,14,i===0?C.gold:C.gold,{bold:true});text(s,d[3],x+20,470,225,44,16,i===0?C.white:C.ink);});
 text(s,"시장 크기보다 기존 집 기록에 추가 가치를 느끼는 순서로 확장합니다",215,585,850,32,21,C.green2,{bold:true,align:"center"});foot(s,19,"가설");notes(s,"확장 순서는 초기 수익모델 검증 후 결정합니다.");
}
// 20
{
 const s=slide(C.green);text(s,"다음 90일",70,55,300,30,17,C.gold,{bold:true});text(s,"기능 확대보다 결제·사용·재사용을 검증합니다",70,105,1080,65,38,C.white,{bold:true});
 const plan=[["01","기준값","설문 표본·인터뷰 수\n현재 검색·연락 시간"],["02","유료 모집","설명·신청·실제 결제\n이탈 이유 기록"],["03","MVP 운영","첫 집·첫 기록\n관계자 참여"],["04","사업 판단","기록 재사용·유지\n운영비·가격"]];
 plan.forEach((d,i)=>{const x=70+i*295;box(s,x,215,270,245,C.white,18);text(s,d[0],x+20,238,50,32,20,C.gold,{bold:true});text(s,d[1],x+20,295,230,34,22,C.green2,{bold:true});text(s,d[2],x+20,355,230,75,17,C.ink);});
 text(s,"계속",80,515,170,28,18,C.gold,{bold:true});text(s,"결제 · 재사용 · 유지 · 운영 가능",250,515,470,28,18,C.white,{bold:true});text(s,"수정",80,560,170,28,18,C.gold,{bold:true});text(s,"사용 낮음 · 초기 등록 부담 · 낮은 참여",250,560,520,28,18,C.white);text(s,"중단 검토",80,605,170,28,18,C.gold,{bold:true});text(s,"결제 없음 · 재사용 없음 · 지원비 과다",250,605,520,28,18,C.white);
 text(s,"목표  유료 20곳 · 주택 1,000채",865,550,330,34,22,C.gold,{bold:true,align:"right"});text(s,"현재 실적이 아닌 검증 목표",865,592,330,26,15,C.white,{align:"right"});foot(s,20,"목표");notes(s,"실행 일정은 현재 날짜와 개발 범위를 반영해 사용자 승인 후 확정합니다.");
}

for(let i=0;i<p.slides.items.length;i++){const b=await p.export({slide:p.slides.items[i],format:"png",scale:1});await fs.writeFile(path.join(TMP,`slide-${String(i+1).padStart(2,"0")}.png`),new Uint8Array(await b.arrayBuffer()));}
const m=await p.export({format:"webp",montage:true,scale:1});await fs.writeFile(path.join(TMP,"montage.webp"),new Uint8Array(await m.arrayBuffer()));
const stage=path.join(ROOT,".codex-finalizer","zipsin-numeric-plan");await fs.mkdir(stage,{recursive:true});const candidate=path.join(stage,"candidate.pptx");await(await PresentationFile.exportPptx(p)).save(candidate);
const result=await finalizePresentation({explicitTotalSlideCount:20,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[14,15],materializeLiteralChartWorkbooks:true,workspaceDir:ROOT,candidatePath:candidate,finalPath:OUT,pythonExecutable:PY,integrityValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_package_integrity.py"),layoutValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_layout_geometry.py"),layoutArgs:["--expected-slide-size-emu","12192000,6858000","--validate-bullet-geometry","--validate-heading-fit"],fontPolicy:{basis:"design",families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(stage,"validation.json")});
console.log(JSON.stringify({out:OUT,montage:path.join(TMP,"montage.webp"),result},null,2));
