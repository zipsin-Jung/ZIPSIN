'use client';

import { ErrorScreen } from '@/components/system/ErrorScreen';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      title="잠시 문제가 생겼어요"
      message="화면을 불러오지 못했어요. 입력하던 집신체크 기록은 이 휴대폰에 그대로 남아 있어요."
      action={<button type="button" onClick={reset} className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cbd9dc] px-6 text-[16px] font-bold text-[#102a43]">다시 시도</button>}
    />
  );
}
