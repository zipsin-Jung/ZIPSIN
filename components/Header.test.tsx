import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen,within} from '@testing-library/react';
import {afterEach,describe,expect,it} from 'vitest';
import Header from './Header';

afterEach(cleanup);

describe('집신 메인 헤더',()=>{
  it('집신체크로 다시 이동하는 링크를 제공한다',()=>{
    render(<Header/>);
    expect(screen.getByRole('link',{name:'집신체크'})).toHaveAttribute('href','/ck');
  });
  it('모바일 메뉴에서도 집신체크로 돌아간다',()=>{
    render(<Header/>);
    fireEvent.click(screen.getByRole('button',{name:'메뉴 열기'}));
    expect(within(screen.getByRole('navigation',{name:'모바일 메뉴'})).getByRole('link',{name:'집신체크'})).toHaveAttribute('href','/ck');
  });
});
