import { getCheckServiceHref } from '@/lib/site/check-host';
import { getSubSiteHref } from '@/lib/site/sub-sites';
import { ZIPSIN_SERVICES } from '@/features/public-home/services';
import styles from '@/components/PublicHome.module.css';

// 홈 상단 서비스 메뉴: 집신체크 · 집신수리 · 집신청소. 누르면 같은 창에서 각 서비스 사이트가 열린다(2026-10-18 대표 결정).
// 수리·청소는 준비 중 화면으로 가며, 화면읽기에는 '(준비 중)'을 함께 읽어 준다.
export function ServiceNav() {
  const hrefs = { check: getCheckServiceHref(), repair: getSubSiteHref('repair'), clean: getSubSiteHref('clean') };
  return (
    <nav aria-label="집신 서비스" className={styles.serviceNav}>
      <ul>
        {ZIPSIN_SERVICES.map((service) => (
          <li key={service.id}>
            <a className={styles.serviceLink} href={hrefs[service.id]}>
              {service.name}
              {service.preparing && <span className={styles.srOnly}> (준비 중)</span>}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
