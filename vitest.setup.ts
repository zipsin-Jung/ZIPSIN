import '@testing-library/jest-dom/vitest';

// 기존 테스트는 회원가입·집신 연결이 열린 상태를 기준으로 한다. 닫힌 상태는 별도 테스트에서 바꿔 확인한다.
process.env.NEXT_PUBLIC_ACCOUNT_OPEN = 'true';

class IntersectionObserverStub implements IntersectionObserver {
  readonly root = null;
  readonly rootMargin = '0px';
  readonly thresholds = [0];
  disconnect() {}
  observe() {}
  takeRecords(): IntersectionObserverEntry[] { return []; }
  unobserve() {}
}

class ResizeObserverStub implements ResizeObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}

Object.defineProperty(window, 'IntersectionObserver', {
  configurable: true,
  value: IntersectionObserverStub,
});

Object.defineProperty(window, 'ResizeObserver', {
  configurable: true,
  value: ResizeObserverStub,
});

Element.prototype.scrollIntoView = () => undefined;
