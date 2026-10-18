/** 동영상 길이(초)를 휴대폰 브라우저에서 잰다. 잴 수 없으면 null(올리지 않음). */
/* v8 ignore start -- 브라우저 동영상 경계는 Preview 휴대폰 확인으로 검증한다. */
export function measureVideoDuration(file: File, timeoutMs = 8000): Promise<number | null> {
  if (typeof document === 'undefined' || typeof URL.createObjectURL !== 'function') return Promise.resolve(null);
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    const done = (value: number | null) => { clearTimeout(timer); URL.revokeObjectURL(url); video.removeAttribute('src'); resolve(value); };
    const timer = setTimeout(() => done(null), timeoutMs);
    video.preload = 'metadata';
    video.muted = true;
    video.onloadedmetadata = () => done(Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration * 100) / 100 : null);
    video.onerror = () => done(null);
    video.src = url;
  });
}
/* v8 ignore stop */
