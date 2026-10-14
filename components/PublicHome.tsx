import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Brand from '@/components/Brand';
import { HomeStoryCarousel } from '@/features/public-home/components/HomeStoryCarousel';
import styles from './PublicHome.module.css';

export default function PublicHome() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">본문 바로가기</a>
    <header className={styles.header}>
      <Link href="/" aria-label="집신 메인"><Brand /></Link>
      <nav aria-label="주 메뉴"><a href="#intro">집신 소개</a><a href="#stories">이런 순간에 집신</a><a href="#features">주요 기능</a><a href="#how">이용 방법</a><Link href="/support">고객지원</Link></nav>
      <div className={styles.headerActions}><Link className={styles.login} href="/login">로그인</Link><Link className={styles.primarySmall} href="/signup">웹에서 시작하기</Link></div>
    </header>

    <main id="main">
      <section id="intro" className={styles.storyHero}>
        <span id="stories" className={styles.anchorTarget} aria-hidden="true" />
        <HomeStoryCarousel />
      </section>

      <section id="features" className={styles.principle}>
        <div><span className={styles.kicker}>사람이 아니라 집에 남는 기록</span><h2>기록은 이어지고,<br />개인정보는 따라가지 않습니다.</h2></div>
        <ul><li><strong>집 한 채에 연결</strong><span>사진·문서·대화·일정을 같은 흐름에서 확인합니다.</span></li><li><strong>관계가 있는 사람만</strong><span>역할·관계·기간이 확인된 사람에게 필요한 범위만 엽니다.</span></li><li><strong>관계가 끝나면 접근 종료</strong><span>기록은 안전하게 남고 이전 계약자의 개인자료는 다음 계약에 넘어가지 않습니다.</span></li></ul>
      </section>

      <section className={styles.continuity} aria-labelledby="continuity-title">
        <div><span className={styles.kicker}>시간이 지나도 이어지는 이유</span><h2 id="continuity-title">계약이 끝나고 사람이 바뀌어도,<br />집에서 있었던 일은 끊기지 않게.</h2></div>
        <div className={styles.continuityCards}><article><strong>직원이 바뀌어도 기록이 이어집니다.</strong><p>개인 휴대전화가 아니라 집과 사무소에 최근 기록과 다음 행동이 남습니다.</p></article><article><strong>입주부터 퇴거까지 같은 집에서 확인합니다.</strong><p>사진·문서·대화·변경사항을 필요한 순간 하나의 흐름으로 꺼냅니다.</p></article></div>
      </section>

      <section id="how" className={styles.how}>
        <div className={styles.sectionHeading}><span className={styles.kicker}>시작은 간단하게</span><h2>집을 만들고, 기록하고, 함께 봅니다.</h2></div>
        <ol><li><span>1</span><strong>집 등록</strong><p>주소를 등록하면 비공개 집 공간과 내부 집 ID가 만들어집니다.</p></li><li><span>2</span><strong>첫 기록</strong><p>사진, PDF, 메모와 일정을 집의 시간순 기록에 남깁니다.</p></li><li><span>3</span><strong>대화와 초대</strong><p>필요한 사람만 초대해 집 관련 대화를 한곳에서 이어갑니다.</p></li></ol>
      </section>

      <section className={styles.finalCta}><span>한 집부터 시작하세요</span><h2>집에 관한 다음 일,<br />이제 놓치지 않도록.</h2><div><Link className={styles.primary} href="/signup">웹에서 시작하기 <ArrowRight size={19} /></Link><Link className={styles.secondary} href="/support">고객지원</Link></div></section>
    </main>

    <footer className={styles.footer}><Brand /><p>집 한 채를 기준으로 이어지는 주거 기록 관리 서비스</p><Link href="/login">로그인</Link><a aria-label="집신 카카오 채널 (새 창)" href="https://pf.kakao.com/_xhcxkFX" target="_blank" rel="noopener noreferrer external" referrerPolicy="no-referrer">카카오 채널</a><span>© 2026 ZIPSIN</span></footer>
  </div>;
}
