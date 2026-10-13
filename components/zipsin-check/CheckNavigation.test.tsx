import '@testing-library/jest-dom/vitest';
import {cleanup,render,screen} from '@testing-library/react';
import {afterEach,describe,expect,it,vi} from 'vitest';
import CheckNavigation from './CheckNavigation';

afterEach(cleanup);

describe('집신체크 주요 메뉴',()=>{
  it('플랫폼 문자 기호 대신 같은 선 스타일의 아이콘을 쓴다',()=>{
    const {container}=render(<CheckNavigation current="home" hasActive canCompare onHome={vi.fn()} onList={vi.fn()} onCheck={vi.fn()} onCompare={vi.fn()}/>);
    expect(screen.getByRole('navigation',{name:'집신체크 주요 메뉴'})).toBeInTheDocument();
    expect(container.querySelectorAll('svg')).toHaveLength(4);
    expect(container).not.toHaveTextContent('⌂');
    expect(container).not.toHaveTextContent('▤');
  });
});
