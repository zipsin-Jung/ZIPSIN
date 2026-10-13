import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  House,
  Image as ImageIcon,
  MessageCircle,
  ShieldCheck,
  Users,
  Wrench,
} from 'lucide-react';
import Brand from '@/components/Brand';
import styles from './PublicHome.module.css';

const records = [
  { icon: FileText, title: '계약과 문서', body: '계약서와 필요한 문서를 집에 연결합니다.' },
  { icon: ImageIcon, title: '사진 기록', body: '입주부터 퇴거까지 변화를 시간순으로 남깁니다.' },
  { icon: Wrench, title: '수리 과정', body: '수리 전·중·후와 비용을 한 흐름으로 확인합니다.' },
  { icon: CalendarDays, title: '일정과 할 일', body: '만기와 방문 일정을 놓치지 않게 이어갑니다.' },
];

const roles = [
  ['공인중개사무소', '사진과 문서가 직원 개인 휴대전화에 흩어지지 않도록 사무소의 집 기록으로 관리합니다.'],
  ['임대인', '직접 방문하지 않아도 집의 변화와 수리 과정을 확인합니다.'],
  ['임차인', '입주 상태와 요청 내용을 남기고 필요한 기록을 함께 확인합니다.'],
];

export default function PublicHome() {
  return (
    <div className={styles.page}>
      <a className={styles.skip} href="#main">본문 바로가기</a>
      <header className={styles.header}>
        <Link href="/" aria-label="집신 메인"><Brand /></Link>
        <nav aria-label="주 메뉴">
          <a href="#why">집신이 필요한 이유</a>
          <a href="#record">무엇을 기록하나요</a>
          <a href="#roles">누가 사용하나요</a>
        </nav>
        <div className={styles.headerActions}>
          <Link className={styles.login} href="/login">로그인</Link>
          <Link className={styles.primarySmall} href="/signup">집신 시작하기</Link>
        </div>
      </header>

      <main id="main">
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.kicker}>집 한 채에 이어지는 모든 기록</span>
            <h1>사람이 바뀌어도,<br />집의 기록은 남아야 하니까.</h1>
            <p>계약부터 입주, 사진, 수리, 일정과 대화까지.<br />흩어진 기록을 집 한 채를 기준으로 이어서 관리하세요.</p>
            <div className={styles.heroActions}>
              <Link className={styles.primary} href="/signup">내 집 기록 시작하기 <ArrowRight size={19} /></Link>
              <Link className={styles.secondary} href="/login">이미 계정이 있어요</Link>
            </div>
            <span className={styles.safety}><ShieldCheck size={17} /> 주소만 안다고 기록을 볼 수 없습니다.</span>
          </div>
          <div className={styles.productScene} aria-label="집신의 집 기록 구조">
            <div className={styles.addressCard}>
              <span><House size={18} /> 집 기록</span>
              <strong>서울시 노원구 · 1203호</strong>
              <small>초대받은 사람만 함께 확인</small>
            </div>
            <div className={styles.timeline}>
              <div><span className={styles.dot} /><b>입주 사진 등록</b><small>사진 12장</small></div>
              <div><span className={styles.dot} /><b>수리 요청 기록</b><small>진행 과정 공유</small></div>
              <div><span className={styles.dot} /><b>계약 일정 확인</b><small>필요한 사람과 함께</small></div>
            </div>
            <div className={styles.people}><Users size={17} /> 임대인 · 임차인 · 공인중개사가 같은 기록을 확인합니다.</div>
          </div>
        </section>

        <section id="why" className={styles.problem}>
          <span className={styles.kicker}>집은 그대로인데 기록만 흩어집니다</span>
          <h2>사진은 휴대전화에,<br />대화는 카카오톡에, 문서는 사무실에.</h2>
          <p>필요한 순간마다 다시 찾고, 다시 묻고, 다시 설명하는 일을 줄입니다.</p>
          <div className={styles.turn}>
            <span>흩어진 사진·문서·대화·일정</span><ArrowRight size={22} /><strong>집 하나의 기록</strong>
          </div>
        </section>

        <section id="record" className={styles.records}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>주소가 아니라 권한으로 연결합니다</span>
            <h2>필요한 기록을, 필요한 사람과.</h2>
            <p>집 주소를 아는 것만으로는 열 수 없습니다. 초대와 관계가 확인된 사람만 함께합니다.</p>
          </div>
          <div className={styles.recordGrid}>
            {records.map(({ icon: Icon, title, body }) => (
              <article key={title}><Icon size={24} /><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
        </section>

        <section className={styles.chatSection}>
          <div>
            <span className={styles.kicker}>개인 휴대전화 밖에서 이어지는 대화</span>
            <h2>집 이야기까지<br />집신 안에서 이어집니다.</h2>
            <p>공인중개사, 임대인, 임차인과 수리기사가 필요한 범위에서 대화하고 사진과 PDF를 직접 공유합니다.</p>
          </div>
          <div className={styles.chatCard}>
            <div><MessageCircle size={18} /><b>월계동 1203호 대화</b></div>
            <p>수리 전 사진을 올렸습니다.</p>
            <p className={styles.own}>확인했습니다. 완료 후 사진도 이곳에 남겨주세요.</p>
            <small>집과 관계가 끝나면 접근 권한도 종료됩니다.</small>
          </div>
        </section>

        <section id="roles" className={styles.roles}>
          <div className={styles.sectionHeading}>
            <span className={styles.kicker}>같은 집, 서로 다른 이유</span>
            <h2>필요한 이유는 달라도 기록은 하나입니다.</h2>
          </div>
          <div className={styles.roleGrid}>
            {roles.map(([title, body]) => <article key={title}><Check size={20} /><h3>{title}</h3><p>{body}</p></article>)}
          </div>
        </section>

        <section className={styles.finalCta}>
          <span>한 집부터 시작하세요</span>
          <h2>집의 기록이 필요한 순간,<br />다시 찾지 않도록.</h2>
          <Link className={styles.primary} href="/signup">집신 시작하기 <ArrowRight size={19} /></Link>
          <Link className={styles.finalLogin} href="/login">로그인</Link>
        </section>
      </main>

      <footer className={styles.footer}>
        <Brand />
        <p>집 한 채를 기준으로 이어지는 주거 기록 관리 서비스</p>
        <span>© 2026 ZIPSIN</span>
      </footer>
    </div>
  );
}
