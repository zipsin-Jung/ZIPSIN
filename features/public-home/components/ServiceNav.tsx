import { getCheckServiceHref } from '@/lib/site/check-host';
import { ZIPSIN_SERVICES } from '@/features/public-home/services';
import styles from '@/components/PublicHome.module.css';

// 홈 상단 서비스 메뉴: 집신체크(바로 가기) · 집신클린(준비 중) · 집신수리(준비 중).
// 준비 중 서비스는 누를 수 있는 것처럼 보이지 않게 링크 없이 표시만 한다.
export function ServiceNav() {
  const checkHref = getCheckServiceHref();
  return (
    <nav aria-label="집신 서비스" className={styles.serviceNav}>
      <ul>
        {ZIPSIN_SERVICES.map((service) => (
          <li key={service.id}>
            {service.status === 'live'
              ? <a className={styles.serviceLink} href={checkHref}>{service.name}</a>
              : (
                <span aria-disabled="true" className={styles.serviceSoon}>
                  {service.name}
                  <small>준비 중</small>
                </span>
              )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
