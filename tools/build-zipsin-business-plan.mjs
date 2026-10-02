import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/zipsin/Documents/ChatGPT/배포";
const SKILL_DIR = "/Users/zipsin/.codex/plugins/cache/openai-primary-runtime/presentations/26.905.11957/skills/presentations";
const TMP_DIR = path.join(ROOT, ".codex-build", "zipsin-business-plan");
const OUTPUT_DIR = path.join(ROOT, "artifacts", "business-plan");
const FINAL_PPTX = path.join(OUTPUT_DIR, "집신_사업계획서_20장_v3.pptx");
const RUNTIME_PYTHON = "/Users/zipsin/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3";
const { resolvePresentationFont, finalizePresentation } = await import(
  pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href,
);

await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });
const family = resolvePresentationFont();

const W = 1280;
const H = 720;
const C = {
  green: "#0E5942",
  green2: "#173F35",
  mint: "#DCEBE3",
  ivory: "#F7F2E7",
  cream: "#FFFDF7",
  gold: "#C79A3B",
  gold2: "#E8D6A8",
  ink: "#17322A",
  gray: "#60716B",
  light: "#E5E8E4",
  white: "#FFFFFF",
  red: "#A4493D",
};

const p = Presentation.create({ slideSize: { width: W, height: H } });
const logo = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/zipsin-company-logo.jpg")));
const landing = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/01_zipsin_landing_reference(1).png")));
const roleUi = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/02_zipsin_role_mobile_ui(1).png")));
const mascots = new Uint8Array(await fs.readFile(path.join(ROOT, "public/images/03_zipsin_mascot_9set(1).png")));

function rect(slide, x, y, w, h, fill, radius = 0, line = "none") {
  return slide.shapes.add({
    geometry: radius ? "roundRect" : "rect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { fill: line, width: line === "none" ? 0 : 1 },
    ...(radius ? { borderRadius: radius } : {}),
  });
}

function txt(slide, text, x, y, w, h, size = 24, color = C.ink, opts = {}) {
  const s = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: "none",
    line: { fill: "none", width: 0 },
  });
  s.text = text;
  s.text.style = {
    typeface: family,
    fontSize: size,
    color,
    bold: opts.bold ?? false,
    alignment: opts.align ?? "left",
    verticalAlignment: opts.valign ?? "top",
    autoFit: "none",
  };
  return s;
}

function title(slide, text, kicker = "", dark = false) {
  if (kicker) txt(slide, kicker.toUpperCase(), 68, 40, 500, 28, 14, C.gold, { bold: true });
  txt(slide, text, 68, 72, 1144, 72, 38, dark ? C.white : C.ink, { bold: true });
  rect(slide, 68, 150, 54, 5, C.gold);
}

function footer(slide, n, status = "") {
  if (status) {
    const fill = status === "확정" ? C.green : status === "가설" ? C.gold : C.gray;
    rect(slide, 68, 665, 72, 25, fill, 13);
    txt(slide, status, 68, 668, 72, 18, 12, C.white, { bold: true, align: "center" });
  }
  txt(slide, String(n).padStart(2, "0"), 1160, 663, 52, 24, 13, C.gray, { align: "right" });
}

function base(fill = C.cream) {
  const s = p.slides.add();
  s.background.fill = fill;
  return s;
}

function card(slide, x, y, w, h, heading, body, accent = C.green) {
  rect(slide, x, y, w, h, C.white, 18, C.light);
  rect(slide, x, y, 7, h, accent, 4);
  txt(slide, heading, x + 28, y + 24, w - 48, 32, 21, C.ink, { bold: true });
  txt(slide, body, x + 28, y + 68, w - 48, h - 82, 17, C.gray);
}

function note(slide, text, sources = []) {
  const src = sources.length ? `\n\n출처\n${sources.join("\n")}` : "";
  slide.speakerNotes.textFrame.setText(`${text}${src}`);
}

// 1
{
  const s = base(C.green2);
  rect(s, 0, 0, W, H, C.green2);
  s.images.add({ blob: logo, contentType: "image/jpeg", alt: "집신 회사 로고", fit: "contain", position: { left: 82, top: 68, width: 88, height: 76 } });
  txt(s, "집신 ZIPSIN", 82, 205, 720, 72, 54, C.white, { bold: true });
  txt(s, "사람이 바뀌어도, 집의 기록은 남습니다", 82, 292, 900, 52, 30, C.gold2, { bold: true });
  txt(s, "집·계약·사무소 업무를 연결하는 주거 기록 협업 서비스", 82, 375, 820, 40, 21, C.white);
  txt(s, "사업계획서  |  2026.10", 82, 600, 320, 28, 15, C.gold2);
  rect(s, 1050, 0, 230, H, C.green);
  txt(s, "기록이\n다음 사람의\n업무가 됩니다", 1078, 252, 160, 160, 25, C.white, { bold: true });
  note(s, "집신 사업계획서 표지. 본 자료의 가격, 일정, 시장 진입 수치는 별도 표기가 없으면 검증 전 가설입니다.");
}

// 2
{
  const s = base(); title(s, "현장에서 시작한 문제", "Founder insight");
  txt(s, "3~5개 공인중개사무소 운영·보조원 실무 경험", 68, 190, 760, 56, 34, C.green, { bold: true });
  txt(s, "매물 의뢰가 들어오면 집을 확인하고 사진을 찍고, 계약 이후에는 연락·서류·수리 기록을 다시 찾아야 했습니다.", 68, 265, 790, 100, 23, C.ink);
  card(s, 68, 410, 335, 150, "반복 방문", "변경사항을 알 수 없어 다시 확인하고 촬영합니다.");
  card(s, 430, 410, 335, 150, "개인에게 묶인 정보", "전화·카톡·사진·종이 서류가 담당자마다 흩어집니다.", C.gold);
  card(s, 792, 410, 335, 150, "끊기는 인수인계", "보조원이 바뀌면 처리 범위와 다음 일이 사라집니다.", C.red);
  footer(s, 2, "확정"); note(s, "창업자 현장 경험을 바탕으로 정리한 문제입니다. 시장 전체를 대표하는 정량 조사 결과는 아닙니다.");
}

// 3
{
  const s = base(C.ivory); title(s, "집 한 채의 정보가 다섯 곳에 흩어집니다", "Current workflow");
  const labels = [["전화", "의뢰와 변경사항"], ["카카오톡", "관계자 대화"], ["사진첩", "광고·입주·수리 사진"], ["PC 폴더", "계약서와 영수증"], ["사람의 기억", "처리 상태와 다음 행동"]];
  labels.forEach((d, i) => {
    const y = 188 + i * 85;
    txt(s, d[0], 78, y, 170, 32, 22, C.green, { bold: true });
    rect(s, 250, y + 11, 340 + i * 55, 4, i === 4 ? C.red : C.gold);
    txt(s, d[1], 630, y, 500, 32, 18, C.gray);
  });
  txt(s, "담당자가 바뀌는 순간, 기록보다 기억이 먼저 끊깁니다", 68, 610, 1040, 38, 27, C.ink, { bold: true });
  footer(s, 3, "확정"); note(s, "현재 업무 방식의 문제 구조를 시각화했습니다.");
}

// 4
{
  const s = base(); title(s, "핵심 문제는 기록 단절과 다음 행동의 부재입니다", "Problem");
  txt(s, "어느 집에서", 90, 215, 245, 54, 31, C.green, { bold: true, align: "center" });
  txt(s, "누가 무엇을", 362, 215, 245, 54, 31, C.green, { bold: true, align: "center" });
  txt(s, "어디까지 했고", 634, 215, 245, 54, 31, C.green, { bold: true, align: "center" });
  txt(s, "다음에는 무엇을", 906, 215, 270, 54, 31, C.green, { bold: true, align: "center" });
  [335,607,879].forEach(x => txt(s, "›", x, 220, 28, 40, 32, C.gold, { bold: true, align: "center" }));
  rect(s, 115, 326, 1050, 150, C.green2, 22);
  txt(s, "이 질문에 답하지 못하면", 160, 360, 960, 34, 23, C.gold2, { bold: true, align: "center" });
  txt(s, "재방문·반복 전달·업무 누락·인수인계 실패가 반복됩니다", 160, 414, 960, 38, 27, C.white, { bold: true, align: "center" });
  txt(s, "절감 규모는 파일럿에서 측정할 가설입니다", 420, 515, 440, 26, 15, C.gray, { align: "center" });
  footer(s, 4, "가설"); note(s, "문제의 존재는 창업자 경험과 정성 인터뷰에서 확인했으나, 시간·비용 절감 폭은 아직 측정하지 않았습니다.");
}

// 5
{
  const s = base(C.green2); title(s, "주거 기록이 발생하는 시장 배경", "Market context", true);
  txt(s, "2,229.4만", 72, 195, 310, 65, 48, C.white, { bold: true });
  txt(s, "2024년 일반가구", 74, 266, 310, 32, 18, C.gold2);
  txt(s, "38.0%", 485, 195, 250, 65, 48, C.white, { bold: true });
  txt(s, "2024년 임차가구 비율", 487, 266, 320, 32, 18, C.gold2);
  txt(s, "330.4만", 865, 195, 310, 65, 48, C.white, { bold: true });
  txt(s, "2채 이상 보유 가구", 867, 266, 300, 32, 18, C.gold2);
  rect(s, 72, 352, 1100, 2, C.gold);
  txt(s, "집신의 초기 시장은 전체 주거 시장이 아니라", 72, 400, 920, 34, 24, C.white);
  txt(s, "여러 집을 관리하고 직원이 함께 일하는 소규모 공인중개사무소", 72, 452, 1050, 50, 31, C.gold2, { bold: true });
  txt(s, "전국 개업공인중개사 현황은 국토교통부가 분기별 공표합니다. 타깃 사무소 수는 파일럿 지역을 정한 뒤 산정합니다.", 72, 555, 1080, 66, 17, C.white);
  footer(s, 5, "확정"); note(s, "외부 통계는 시장 배경을 보여주며 집신의 유료 수요를 증명하지는 않습니다.", ["국가데이터처, 2024년 주택소유통계 결과, 2025-11-14, https://mods.go.kr/board.es?act=view&bid=11471&list_no=439298&mid=a10301100400", "국가데이터처, 한국의 사회동향 2025, 임차가구의 주거 상황과 지원 정책의 변화, https://www.kostat.go.kr/boardDownload.es?bid=12310&list_no=443092&seq=1", "국토교통부 통계누리, 개업공인중개사 현황(분기별), https://stat.molit.go.kr/portal/cate/statView.do?hFormId=7146&hRsId=292"]);
}

// 6
{
  const s = base(); title(s, "집신은 집을 기준으로 기록과 업무를 연결합니다", "Solution");
  rect(s, 460, 195, 360, 305, C.green, 150);
  txt(s, "집", 560, 250, 160, 54, 44, C.white, { bold: true, align: "center" });
  txt(s, "한 채", 535, 315, 210, 45, 28, C.gold2, { bold: true, align: "center" });
  txt(s, "기록의 기준점", 515, 388, 250, 34, 19, C.white, { align: "center" });
  const items = [["계약", 98, 215], ["사무소 업무", 80, 400], ["사건", 975, 215], ["사진·문서·대화", 930, 400]];
  items.forEach(([t,x,y],i)=>{rect(s,x,y,245,86,C.ivory,18,C.gold2);txt(s,t,x+12,y+25,221,35,20,C.ink,{bold:true,align:"center"});});
  txt(s, "사람이 바뀌어도 권한 있는 다음 담당자가 맥락과 다음 행동을 이어받습니다", 180, 565, 920, 48, 25, C.ink, { bold: true, align: "center" });
  footer(s, 6, "확정"); note(s, "집신의 제품 정의와 핵심 가치입니다.");
}

// 7
{
  const s = base(C.ivory); title(s, "수리는 집에서 발생하는 여러 사건 중 하나입니다", "Product boundary");
  txt(s, "계약 전", 70, 205, 170, 34, 23, C.green, { bold: true, align: "center" });
  txt(s, "계약", 267, 205, 170, 34, 23, C.green, { bold: true, align: "center" });
  txt(s, "입주", 464, 205, 170, 34, 23, C.green, { bold: true, align: "center" });
  txt(s, "거주·수리", 661, 205, 190, 34, 23, C.green, { bold: true, align: "center" });
  txt(s, "퇴거", 878, 205, 170, 34, 23, C.green, { bold: true, align: "center" });
  rect(s, 145, 275, 845, 12, C.gold, 6);
  [150,347,544,751,953].forEach(x=>rect(s,x,259,42,42,C.green,21));
  txt(s, "광고 사진", 92, 328, 160, 30, 17, C.gray, { align: "center" });
  txt(s, "계약서", 289, 328, 160, 30, 17, C.gray, { align: "center" });
  txt(s, "입주 상태", 486, 328, 160, 30, 17, C.gray, { align: "center" });
  txt(s, "변경·수리 기록", 672, 328, 190, 30, 17, C.gray, { align: "center" });
  txt(s, "퇴거 확인", 895, 328, 160, 30, 17, C.gray, { align: "center" });
  rect(s, 210, 430, 860, 112, C.white, 20, C.light);
  txt(s, "수리기사 중개·견적 비교·앱 결제는 초기 범위에서 제외", 260, 462, 760, 35, 24, C.red, { bold: true, align: "center" });
  footer(s, 7, "확정"); note(s, "집신은 수리 플랫폼으로 정의하지 않습니다. 수리는 핵심 사용 사례지만 제품 전체가 아닙니다.");
}

// 8
{
  const s = base(); title(s, "네 사용자가 같은 집을 서로 다른 이유로 봅니다", "Users and value");
  card(s, 68, 190, 535, 160, "대표 공인중개사", "여러 집과 직원의 멈춘 일·다음 일을 보고 사무소의 기록을 지킵니다.", C.green);
  card(s, 677, 190, 535, 160, "보조원", "개인 기억과 카톡 검색 없이 배정된 집의 맥락과 다음 행동을 이어받습니다.", C.gold);
  card(s, 68, 390, 535, 160, "임대인", "방문과 반복 설명을 줄이고 여러 중개사에 최신 집 상태를 안전하게 공유합니다.", C.green);
  card(s, 677, 390, 535, 160, "임차인", "현재 계약 범위에서 입주 상태와 요청 처리 과정을 확인합니다.", C.gold);
  txt(s, "결제 고객: 공인중개사무소    사용 확장: 임대인·임차인 초대", 250, 596, 780, 32, 20, C.ink, { bold: true, align: "center" });
  footer(s, 8, "확정"); note(s, "공인중개사무소는 초기 결제 고객이자 임대인·임차인을 연결하는 도입 채널입니다.");
}

// 9
{
  const s = base(C.ivory); title(s, "매물 의뢰부터 퇴거까지 하나의 집 타임라인이 이어집니다", "Core journey");
  const steps = ["매물 의뢰", "현장 확인·촬영", "광고", "계약·문서", "입주 상태", "사건·수리", "퇴거"];
  rect(s, 95, 315, 1070, 8, C.gold, 4);
  steps.forEach((t,i)=>{
    const x = 95 + i * 178;
    rect(s,x,290,58,58,i===3?C.gold:C.green,29);
    txt(s,String(i+1),x,304,58,24,16,C.white,{bold:true,align:"center"});
    txt(s,t,x-45,370,150,60,18,C.ink,{bold:true,align:"center"});
  });
  txt(s, "각 단계의 사진·문서·대화·일정이 집과 계약에 연결됩니다", 215, 515, 850, 40, 25, C.green, { bold: true, align: "center" });
  footer(s, 9, "확정"); note(s, "일반 매물 의뢰의 핵심 사용자 흐름입니다.");
}

// 10
{
  const s = base(); title(s, "현재는 랜딩페이지와 체험형 화면까지 구현했습니다", "Current product");
  s.images.add({ blob: landing, contentType: "image/png", alt: "집신 랜딩페이지 디자인 참고 화면", fit: "cover", position: { left: 68, top: 180, width: 700, height: 410 }, geometry: "roundRect", borderRadius: 20 });
  card(s, 815, 190, 365, 122, "구현 완료", "Next.js 랜딩페이지\n역할별 화면 데모\n요금제·폼 상호작용", C.green);
  card(s, 815, 335, 365, 122, "아직 미구현", "실제 가입·DB·인증\n채팅·알림·PDF\n결제·관리자", C.red);
  txt(s, "start.zipsin.net", 833, 520, 320, 30, 19, C.green, { bold: true });
  txt(s, "현재 랜딩 데모의 수리기사 역할은 향후 웹앱 핵심 4역할에서 제외 예정\n사전가입 폼은 저장·전송하지 않는 체험용", 815, 552, 365, 68, 14, C.gray);
  footer(s, 10, "확정"); note(s, "현재 구현 상태를 실제 웹앱 기능과 구분해 표시했습니다. 랜딩페이지는 배포되었지만 실제 가입 접수는 구현하지 않았습니다.");
}

// 11
{
  const s = base(C.green2); title(s, "핵심 화면은 기록보다 다음 행동을 먼저 보여줍니다", "Product experience", true);
  s.images.add({ blob: roleUi, contentType: "image/png", alt: "집신 역할별 모바일 화면 시안", fit: "contain", position: { left: 58, top: 150, width: 650, height: 510 } });
  txt(s, "오늘의 업무", 760, 195, 360, 34, 26, C.gold2, { bold: true });
  txt(s, "답변 대기·기한 초과·멈춘 집을 먼저 확인", 760, 240, 390, 58, 19, C.white);
  txt(s, "집 상세 타임라인", 760, 330, 360, 34, 26, C.gold2, { bold: true });
  txt(s, "계약·사진·사건·문서가 시간순으로 연결", 760, 375, 390, 58, 19, C.white);
  txt(s, "역할 구조 변경 예정", 760, 465, 360, 34, 26, C.gold2, { bold: true });
  txt(s, "현재 랜딩 시안: 공인중개사·임대인·임차인·수리기사\n향후 웹앱: 대표·보조원·임대인·임차인", 760, 508, 410, 78, 17, C.white);
  footer(s, 11, "가설"); note(s, "모바일 UI는 방향 시안이며 실제 웹앱 기능은 미구현입니다.");
}

// 12
{
  const s = base(); title(s, "세 가지 반복 업무에서 첫 가치를 검증합니다", "Use cases");
  card(s, 68, 190, 350, 330, "01  매물 의뢰", "의뢰 등록\n담당 보조원 지정\n현장 사진 촬영\n광고·계약 상태 기록\n임차인 초대", C.green);
  card(s, 465, 190, 350, 330, "02  사건·수리", "사진과 설명 등록\n담당자·예정일 지정\n전·중·후 사진\n영수증 첨부\n선택 기록 PDF", C.gold);
  card(s, 862, 190, 350, 330, "03  직원 변경", "진행 중 업무 분류\n새 담당자 지정\n최근 대화 확인\n다음 행동 인계\n이전 접근 종료", C.red);
  txt(s, "첫 파일럿은 세 흐름의 반복 사용과 실제 시간 절감을 측정합니다", 225, 580, 830, 38, 24, C.ink, { bold: true, align: "center" });
  footer(s, 12, "가설"); note(s, "제품 가치를 검증할 대표 업무 세 가지입니다.");
}

// 13
{
  const s = base(C.ivory); title(s, "주소가 같아도 기록은 자동으로 공개되지 않습니다", "Trust by design");
  const rows = [
    ["집 ID", "시스템이 자동 생성", "사용자가 키를 기억하거나 주소로 접근하지 않음"],
    ["계약", "참여자와 기간을 새로 설정", "이전 임차인 개인정보 자동 승계 금지"],
    ["사무소", "대표가 직원 접근 관리", "퇴사 즉시 종료하고 업무를 이전"],
    ["공유", "공간별 안전한 기본값", "중개용 현황에서 계약서·계좌·내부메모 제외"],
    ["PDF", "사용자가 기록을 선택", "개인정보·계좌정보 기본 제외"],
  ];
  rows.forEach((r,i)=>{
    const y=185+i*82;
    if(i%2===0) rect(s,68,y,1144,68,C.white,10);
    txt(s,r[0],86,y+18,130,30,18,C.green,{bold:true});
    txt(s,r[1],235,y+18,330,30,18,C.ink,{bold:true});
    txt(s,r[2],590,y+18,590,38,16,C.gray);
  });
  footer(s, 13, "확정"); note(s, "권한과 개인정보 보호는 1차 제품 원칙입니다. 세부 보존·파기 정책과 공식 소유권 확인 수준은 미결정입니다.");
}

// 14
{
  const s = base(); title(s, "대체재는 기록하지만 집신은 업무 맥락까지 이어줍니다", "Alternatives");
  const cols = [
    ["전화·메신저", "대화는 빠름", "집별 상태와 담당 업무가 흩어짐"],
    ["사진첩·드라이브", "파일 보관", "계약·참여자·다음 행동이 연결되지 않음"],
    ["수리 플랫폼", "수리 거래", "계약 전후의 전체 집 이력을 다루지 않음"],
    ["집신", "집·계약·업무 연결", "담당자 변경과 권한 회수까지 같은 흐름"],
  ];
  cols.forEach((c,i)=>{
    const x=68+i*286;
    rect(s,x,190,260,355,i===3?C.green2:C.ivory,18,i===3?C.green2:C.light);
    txt(s,c[0],x+22,225,216,34,21,i===3?C.gold2:C.green,{bold:true,align:"center"});
    txt(s,c[1],x+22,300,216,54,19,i===3?C.white:C.ink,{bold:true,align:"center"});
    rect(s,x+50,380,160,2,i===3?C.gold:C.light);
    txt(s,c[2],x+24,420,212,84,16,i===3?C.white:C.gray,{align:"center"});
  });
  footer(s, 14, "가설"); note(s, "경쟁사 실명 비교가 아니라 현재 사용하는 대체 방식과 제품 구조의 차이를 비교했습니다. 실제 경쟁 서비스 기능·가격 조사는 후속 과제입니다.");
}

// 15
{
  const s = base(C.green2); title(s, "첫 고객은 여러 집과 직원을 함께 관리하는 사무소입니다", "Beachhead customer", true);
  txt(s, "초기 고객 조건", 70, 186, 320, 40, 27, C.gold2, { bold: true });
  const bullets=["다가구 건물 또는 여러 임대 물건을 반복 관리", "대표와 한 명 이상의 보조원이 함께 근무", "사진·연락처·계약서가 개인 휴대전화에 분산", "업무 인수인계와 반복 방문 문제가 빈번"];
  bullets.forEach((b,i)=>{rect(s,75,260+i*74,24,24,C.gold,12);txt(s,b,120,251+i*74,590,46,20,C.white);});
  rect(s,780,182,410,370,C.ivory,28);
  txt(s, "도입 확장 구조", 830,225,310,34,24,C.green,{bold:true,align:"center"});
  const chain=["사무소 1곳", "보조원", "관리 집", "임대인·임차인"];
  chain.forEach((t,i)=>{const y=290+i*63;txt(s,t,845,y,280,30,19,C.ink,{bold:true,align:"center"}); if(i<3) txt(s,"↓",970,y+34,30,25,20,C.gold,{bold:true,align:"center"});});
  txt(s, "초대 수락률이 낮으면 확장이 멈춥니다", 790,510,390,25,15,C.red,{bold:true,align:"center"});
  footer(s, 15, "가설"); note(s, "초기 고객 세그먼트와 사무소 중심 유통 구조는 파일럿으로 검증할 가설입니다.");
}

// 16
{
  const s = base(); title(s, "월 구독 가격은 유료 파일럿에서 검증합니다", "Revenue model");
  rect(s, 70, 190, 510, 360, C.green2, 24);
  txt(s, "BUSINESS", 110, 230, 430, 30, 19, C.gold2, { bold: true });
  txt(s, "월 99,000원", 110, 290, 430, 62, 44, C.white, { bold: true });
  txt(s, "공인중개사무소  |  최대 50채", 110, 365, 430, 35, 21, C.white);
  txt(s, "출시 전 가격 가설", 110, 470, 220, 28, 16, C.gold2, { bold: true });
  txt(s, "검증할 단위경제", 680, 205, 430, 40, 27, C.green, { bold: true });
  const econ=["사무소당 활성 집 수와 직원 수", "사진·문서 저장량과 전송량", "문자·본인확인·PDF 변동비", "도입 지원과 고객 응대 시간", "50채 초과 요금 및 보존 정책"];
  econ.forEach((t,i)=>{txt(s,String(i+1).padStart(2,"0"),685,278+i*59,42,28,15,C.gold,{bold:true});txt(s,t,745,272+i*59,430,36,18,C.ink);});
  footer(s, 16, "가설"); note(s, "월 99,000원·최대 50채는 현재 랜딩페이지의 출시 전 예상 가격입니다. 실제 결제 의사와 비용 구조를 파일럿에서 확인해야 합니다.");
}

// 17
{
  const s = base(C.ivory); title(s, "3개 사무소의 실제 결제와 반복 사용으로 검증합니다", "Paid pilot");
  const phase=[
    ["대상", "문제가 뚜렷한 사무소 3곳"],
    ["기간", "4주 유료 실증"],
    ["범위", "실제 집 2개 흐름 + 인수인계 시나리오"],
    ["판단", "재결제 의사와 업무 절감 증거"],
  ];
  phase.forEach((d,i)=>{const x=68+i*286;rect(s,x,185,260,120,C.white,16,C.light);txt(s,d[0],x+20,207,220,25,15,C.gold,{bold:true});txt(s,d[1],x+20,244,220,43,19,C.ink,{bold:true});});
  txt(s, "핵심 지표", 68, 365, 200, 34, 25, C.green, { bold: true });
  const metrics=["실제 결제", "주간 반복 사용", "등록 집 수", "초대 수락률", "재방문 횟수", "처리 기간", "인수인계 시간", "PDF 사용"];
  metrics.forEach((m,i)=>{const col=i%4,row=Math.floor(i/4);rect(s,68+col*286,420+row*72,260,50,col<2?C.green:C.white,12,col<2?C.green:C.light);txt(s,m,80+col*286,434+row*72,236,25,17,col<2?C.white:C.ink,{bold:true,align:"center"});});
  footer(s, 17, "가설"); note(s, "파일럿 조건은 제안안입니다. 할인 여부, 참여 집 수, 성공 기준의 수치는 사용자 승인 후 확정합니다.");
}

// 18
{
  const s = base(); title(s, "웹앱은 검증 순서에 맞춰 네 단계로 확장합니다", "Roadmap");
  const steps=[
    ["0", "현재", "랜딩페이지\n체험형 UI\n배포 완료", C.green],
    ["1", "유료 MVP", "계정·집·업무\n사진·문서\n권한·PDF", C.gold],
    ["2", "현장 검증", "3개 사무소\n4주 반복 사용\n가격 검증", C.green],
    ["3", "고도화", "다가구 관리\n공유·보존정책\nOCR·AI 검토", C.gray],
  ];
  steps.forEach((d,i)=>{const x=68+i*286;rect(s,x,190,260,350,C.white,18,C.light);rect(s,x,190,260,14,d[3],7);txt(s,d[0],x+20,235,45,45,30,d[3],{bold:true});txt(s,d[1],x+75,239,160,35,23,C.ink,{bold:true});txt(s,d[2],x+25,325,210,135,19,C.gray,{align:"center"});});
  txt(s, "수리기사 중개·견적 비교·앱 결제는 초기 로드맵에서 제외", 250, 590, 780, 30, 19, C.red, { bold: true, align: "center" });
  footer(s, 18, "가설"); note(s, "현재 완료 상태와 향후 개발 계획을 구분했습니다. 일정과 개발비는 상세 설계 후 확정합니다.");
}

// 19
{
  const s = base(C.ivory); title(s, "사업 리스크는 제품 기본값과 파일럿으로 줄입니다", "Risks");
  const risks=[
    ["개인정보 오공개", "계약 단위 권한·서버 인가·접근기록"],
    ["도입과 입력 부담", "미리 정한 업무 흐름·역할별 첫 화면"],
    ["초대 수락 저조", "사무소 가치부터 단독 검증 후 초대 확장"],
    ["저장·알림 비용", "용량 제한·압축·보존 정책·핵심 알림"],
    ["기록의 법적 오인", "작성자·시간·수정이력 표시, 법적 보장 표현 금지"],
  ];
  risks.forEach((r,i)=>{const y=180+i*88;txt(s,r[0],78,y+18,290,32,20,C.red,{bold:true});rect(s,385,y+30,85,3,C.gold);txt(s,r[1],500,y+12,660,48,18,C.ink);});
  footer(s, 19, "미결정"); note(s, "세부 보존·파기, 소유권 확인, 집 매매·사무소 폐업 시 기록 이전 정책은 법률·개인정보 전문가 검토가 필요합니다.");
}

// 20
{
  const s = base(C.green2);
  s.images.add({ blob: mascots, contentType: "image/png", alt: "집신 캐릭터 모음", fit: "contain", position: { left: 760, top: 100, width: 440, height: 440 } });
  txt(s, "다음 단계", 76, 75, 400, 44, 20, C.gold2, { bold: true });
  txt(s, "첫 유료 고객과\n함께 제품을 만듭니다", 76, 145, 650, 135, 44, C.white, { bold: true });
  const next=["파일럿 후보 사무소 3곳 모집", "MVP 범위·성공 기준 승인", "MVP 개발·개인정보 기본 통제 검수", "4주 유료 실증 후 가격 결정"];
  next.forEach((t,i)=>{rect(s,80,350+i*58,25,25,C.gold,13);txt(s,t,125,342+i*58,540,38,20,C.white,{bold:i===0});});
  txt(s, "목표: 사전가입자 1,000명  |  실적이 아닌 모집 목표", 78, 620, 640, 28, 15, C.gold2);
  txt(s, "start.zipsin.net", 936, 635, 260, 25, 16, C.white, { bold: true, align: "right" });
  footer(s, 20, "가설"); note(s, "요청 사항: 유료 파일럿 사무소 소개, 개인정보를 제거한 현장 사례, MVP 범위와 성공 기준 승인. 사전가입자 1,000명은 목표입니다.");
}

// Export previews for visual inspection.
for (let i = 0; i < p.slides.items.length; i += 1) {
  const blob = await p.export({ slide: p.slides.items[i], format: "png", scale: 1 });
  await fs.writeFile(path.join(TMP_DIR, `slide-${String(i + 1).padStart(2, "0")}.png`), new Uint8Array(await blob.arrayBuffer()));
}
const montage = await p.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(TMP_DIR, "montage.webp"), new Uint8Array(await montage.arrayBuffer()));

const requirements = {
  explicitTotalSlideCount: 20,
  requiredNativeTableOwnerSlides: [],
  requiredNativeChartOwnerSlides: [],
};
const fontPolicy = { basis: "design", families: [family] };
const stagingDir = path.join(ROOT, ".codex-finalizer", "zipsin-business-plan");
await fs.mkdir(stagingDir, { recursive: true });
const candidatePath = path.join(stagingDir, "candidate.pptx");
await (await PresentationFile.exportPptx(p)).save(candidatePath);

const result = await finalizePresentation({
  ...requirements,
  workspaceDir: ROOT,
  candidatePath,
  finalPath: FINAL_PPTX,
  pythonExecutable: RUNTIME_PYTHON,
  integrityValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath: path.join(SKILL_DIR, "container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs: [
    "--expected-slide-size-emu", "12192000,6858000",
    "--validate-bullet-geometry",
    "--validate-heading-fit",
  ],
  requiredNativeTableOwnerSlides: [],
  fontPolicy,
  verifyArtifactToolImport: true,
  receiptPath: path.join(stagingDir, "집신_사업계획서_20장_v3.pptx.validation.json"),
});

console.log(JSON.stringify({ finalPath: FINAL_PPTX, montage: path.join(TMP_DIR, "montage.webp"), family, result }, null, 2));
