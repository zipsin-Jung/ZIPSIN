import { permanentRedirect } from 'next/navigation';

/** 예전 체험용 소개 페이지는 없앴습니다. 예전 링크로 들어오면 홈으로 보냅니다. */
export default function AboutPage() {
  permanentRedirect('/');
}
