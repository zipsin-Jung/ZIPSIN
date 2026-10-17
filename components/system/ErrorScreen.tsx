import Link from 'next/link';

type Props = { title: string; message: string; action?: React.ReactNode };

/** 404·오류 화면 공통 틀. 영어 기본 화면 대신 한국어 안내와 돌아갈 길을 준다. */
export function ErrorScreen({ title, message, action }: Props) {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-5 py-16 text-center">
      <p className="rounded-full bg-[#fff5c9] px-4 py-2 text-[15px] font-bold text-[#755c05]">집신</p>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-[-0.04em] text-[#102a43]">{title}</h1>
      <p className="mt-3 text-[17px] leading-relaxed text-[#4c5f6b]">{message}</p>
      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        {action}
        <Link href="/" className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0b695c] px-6 text-[16px] font-bold text-white">집신 홈으로</Link>
        <Link href="/ck" className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#9fcfc0] px-6 text-[16px] font-bold text-[#0b695c]">집신체크로</Link>
      </div>
    </main>
  );
}
