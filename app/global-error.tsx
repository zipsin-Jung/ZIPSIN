'use client';

/** 맨 바깥 화면까지 실패했을 때. 공통 스타일이 없을 수 있어 글자 크기·색을 직접 준다. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const button = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minHeight: 48, padding: '0 24px', borderRadius: 12, fontSize: 16, fontWeight: 700, textDecoration: 'none' } as const;
  return (
    <html lang="ko">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fbfaf5', color: '#102a43' }}>
        <main style={{ maxWidth: 560, margin: '0 auto', padding: '80px 20px', textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800 }}>잠시 문제가 생겼어요</h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, color: '#4c5f6b' }}>화면을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28 }}>
            <button type="button" onClick={reset} style={{ ...button, border: '1px solid #cbd9dc', background: '#fff', color: '#102a43' }}>다시 시도</button>
            <a href="/" style={{ ...button, background: '#0b695c', color: '#fff' }}>집신 홈으로</a>
          </div>
        </main>
      </body>
    </html>
  );
}
