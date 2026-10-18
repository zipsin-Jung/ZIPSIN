import Link from 'next/link';
import Brand from '@/components/Brand';
import { InstallAppButton } from '@/features/install/components/InstallAppButton';
import { HomeStoryCarousel } from '@/features/public-home/components/HomeStoryCarousel';
import { ServiceNav } from '@/features/public-home/components/ServiceNav';
import { isAccountOpen } from '@/lib/site/account-launch';
import styles from './PublicHome.module.css';

export default function PublicHome() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">본문 바로가기</a>
    <header className={styles.header}>
      <Link href="/" aria-label="집신 메인"><Brand /></Link>
      <ServiceNav />
      <div className={styles.headerActions} data-header-actions>
        <InstallAppButton />
        {isAccountOpen() ? <>
          <Link className={styles.login} href="/login">로그인</Link>
          <Link className={styles.primarySmall} href="/signup">회원가입</Link>
        </> : <span className={styles.authSoon} aria-disabled="true" title="준비 중"><span className={styles.authLong}>로그인 · 회원가입</span><span className={styles.authShort}>로그인</span> <small>준비 중</small></span>}
      </div>
    </header>

    <main id="main" className={styles.singleMain}>
      <section className={styles.storyHero}>
        <HomeStoryCarousel />
      </section>
    </main>
  </div>;
}
