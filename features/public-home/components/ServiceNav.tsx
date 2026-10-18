import { getCheckServiceHref } from '@/lib/site/check-host';
import { getRepairServiceHref } from '@/lib/site/repair-host';
import { ZIPSIN_SERVICES } from '@/features/public-home/services';
import styles from '@/components/PublicHome.module.css';

// 홈 상단 서비스 메뉴: 집신체크(바로 가기) · 집신수리(준비 중 화면) · 집신클린.
// 집신클린은 회색으로 표시하고 누를 수 없다(2026-10-16 18:40 사용자 결정 D3).
// 집신수리는 누르면 준비 중 화면으로 간다(2026-10-18 대표 지시로 D3에서 수리만 변경).
export function ServiceNav() {
  const checkHref = getCheckServiceHref();
  const repairHref = getRepairServiceHref();
  return (
    <nav aria-label="집신 서비스" className={styles.serviceNav}>
      <ul>
        {ZIPSIN_SERVICES.map((service) => (
          <li key={service.id}>
            {service.status === 'live' ? (
              <a className={styles.serviceLink} href={checkHref}>{service.name}</a>
            ) : service.status === 'preparing' ? (
              <a className={styles.serviceLink} href={repairHref}>
                {service.name}
                <span className={styles.srOnly}> (준비 중)</span>
              </a>
            ) : (
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
