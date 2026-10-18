import { getCheckServiceHref } from '@/lib/site/check-host';
import { ZIPSIN_SERVICES } from '@/features/public-home/services';
import styles from '@/components/PublicHome.module.css';

// 홈 상단 서비스 메뉴: 집신체크(바로 가기) · 집신수리 · 집신청소.
// 준비 중 서비스는 회색으로 표시하고 누를 수 없게 한다(2026-10-16 18:40 사용자 결정 D3).
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
                <span aria-disabled="true" className={styles.serviceSoon} title="준비 중">
                  {service.name}
                  <span className={styles.srOnly}> (준비 중)</span>
                </span>
              )}
          </li>
        ))}
      </ul>
    </nav>
  );
}
