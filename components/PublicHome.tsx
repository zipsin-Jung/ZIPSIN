import Link from 'next/link';
import Brand from '@/components/Brand';
import { InstallAppButton } from '@/features/install/components/InstallAppButton';
import { HomeStoryCarousel } from '@/features/public-home/components/HomeStoryCarousel';
import { ServiceNav } from '@/features/public-home/components/ServiceNav';
import styles from './PublicHome.module.css';

export default function PublicHome() {
  return <div className={styles.page}>
    <a className={styles.skip} href="#main">본문 바로가기</a>
    <header className={styles.header}>
      <Link href="/" aria-label="집신 메인"><Brand /></Link>
      <ServiceNav />
      <div className={styles.headerActions} data-header-actions>
        <InstallAppButton />
        <Link className={styles.login} href="/login">로그인</Link>
        <Link className={styles.primarySmall} href="/signup">회원가입</Link>
      </div>
    </header>

    <main id="main" className={styles.singleMain}>
      <section className={styles.storyHero}>
        <HomeStoryCarousel />
      </section>
    </main>
  </div>;
}
