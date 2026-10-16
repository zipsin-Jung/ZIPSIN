import { getCheckServiceHref } from '@/lib/site/check-host';
import { ZIPSIN_SERVICES } from '@/features/public-home/services';
import { ComingSoonButton } from '@/features/public-home/components/ComingSoonButton';
import styles from '@/components/PublicHome.module.css';

// 홈 상단 서비스 메뉴: 집신체크(바로 가기) · 집신수리 · 집신클린.
// 준비 중 서비스는 다른 화면으로 보내지 않고, 누르면 가운데에 "준비 중" 안내만 띄운다.
export function ServiceNav() {
  const checkHref = getCheckServiceHref();
  return (
    <nav aria-label="집신 서비스" className={styles.serviceNav}>
      <ul>
        {ZIPSIN_SERVICES.map((service) => (
          <li key={service.id}>
            {service.status === 'live'
              ? <a className={styles.serviceLink} href={checkHref}>{service.name}</a>
              : <ComingSoonButton name={service.name} />}
          </li>
        ))}
      </ul>
    </nav>
  );
}
