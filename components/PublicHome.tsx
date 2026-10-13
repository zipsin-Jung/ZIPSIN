import Link from 'next/link';
import { ArrowRight, FileText, House, MessageCircle, ShieldCheck } from 'lucide-react';
import Brand from '@/components/Brand';
import { ScenarioExplorer } from '@/features/public-home/components/ScenarioExplorer';
import styles from './PublicHome.module.css';

export default function PublicHome() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">본문 바로가기</a>
    <header className={styles.header}>
      <Link href="/" aria-label="집신 메인"><Brand /></Link>
      <nav aria-label="주 메뉴"><a href="#intro">집신 소개</a><a href="#moments">이런 순간에 집신</a><a href="#features">주요 기능</a><a href="#how">이용 방법</a><Link href="/support">고객지원</Link></nav>
      <div className={styles.headerActions}><Link className={styles.login} href="/login">로그인</Link><Link className={styles.primarySmall} href="/signup">웹에서 시작하기</Link></div>
    </header>

    <main id="main">
      <section id="intro" className={styles.hero}>
        <div className={styles.heroCopy}>
          <span className={styles.kicker}>집 한 채에 이어지는 기록</span>
          <h1>집에 관한 일,<br />다시 묻고 다시 찾지 않도록.</h1>
          <p>계약서, 사진, 대화, 일정과 집에서 있었던 일을 집 한 채에 이어서 기록하세요.</p>
          <div className={styles.heroActions}><Link className={styles.primary} href="/signup">웹에서 시작하기 <ArrowRight size={19} /></Link><Link className={styles.secondary} href="/login">로그인</Link></div>
          <span className={styles.safety}><ShieldCheck size={17} /> 주소만 알아서는 어떤 기록도 볼 수 없습니다.</span>
        </div>

        <div className={styles.heroProduct} aria-label="집신 실제 제품 화면 예시">
          <div className={styles.appTopbar}><span>우리 집</span><strong>서울 노원구 · 1203호</strong></div>
          <div className={styles.nextAction}><span>다음 일정</span><strong>계약 만기 전 갱신 여부 확인</strong><time>2027년 2월 28일</time></div>
          <div className={styles.quickRecords}><span><FileText size={18} /> 계약 문서</span><span><MessageCircle size={18} /> 집 대화</span><span><House size={18} /> 전체 기록</span></div>
          <div className={styles.latestRecord}><small>최근 기록</small><strong>입주 전 거실 상태 사진</strong><span>사진 8장 · 2025. 02. 18</span></div>
        </div>
      </section>

      <section id="moments" className={styles.moments}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>이런 순간에 집신</span><h2>찾고, 묻고, 설명하는 일을<br />한 번으로 줄입니다.</h2><p>상황을 좌우로 넘겨 보세요. 선택한 순간에 필요한 집신 화면이 바로 나타납니다.</p></div>
        <ScenarioExplorer />
      </section>

      <section id="features" className={styles.principle}>
        <div><span className={styles.kicker}>사람이 아니라 집에 남는 기록</span><h2>기록은 이어지고,<br />개인정보는 따라가지 않습니다.</h2></div>
        <ul><li><strong>집 한 채에 연결</strong><span>사진·문서·대화·일정을 같은 흐름에서 확인합니다.</span></li><li><strong>관계가 있는 사람만</strong><span>역할·관계·기간이 확인된 사람에게 필요한 범위만 엽니다.</span></li><li><strong>관계가 끝나면 접근 종료</strong><span>기록은 안전하게 남고 이전 계약자의 개인자료는 다음 계약에 넘어가지 않습니다.</span></li></ul>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>시작은 간단하게</span><h2>집을 만들고, 기록하고, 함께 봅니다.</h2></div>
        <ol><li><span>1</span><strong>집 등록</strong><p>주소를 등록하면 비공개 집 공간과 내부 집 ID가 만들어집니다.</p></li><li><span>2</span><strong>첫 기록</strong><p>사진, PDF, 메모와 일정을 집의 시간순 기록에 남깁니다.</p></li><li><span>3</span><strong>대화와 초대</strong><p>필요한 사람만 초대해 집 관련 대화를 한곳에서 이어갑니다.</p></li></ol>
      </section>

      <section className={styles.finalCta}><span>한 집부터 시작하세요</span><h2>집에 관한 다음 일,<br />이제 놓치지 않도록.</h2><div><Link className={styles.primary} href="/signup">웹에서 시작하기 <ArrowRight size={19} /></Link><Link className={styles.secondary} href="/support">고객지원</Link></div></section>
    </main>

    <footer className={styles.footer}><Brand /><p>집 한 채를 기준으로 이어지는 주거 기록 관리 서비스</p><Link href="/login">로그인</Link><span>© 2026 ZIPSIN</span></footer>
  </div>;
}
