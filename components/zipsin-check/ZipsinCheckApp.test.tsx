import '@testing-library/jest-dom/vitest';
import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,beforeEach,describe,expect,it} from 'vitest';
import {createCandidate} from '@/lib/zipsin-check/state';
import {CHECK_STORAGE_KEY,CHECK_STORAGE_KEY_V2} from '@/lib/zipsin-check/storage';
import ZipsinCheckApp from './ZipsinCheckApp';
beforeEach(()=>localStorage.clear());afterEach(cleanup);
describe('집신체크 V2 등록',()=>{
it('입력 없이 바로 체크를 시작한다',()=>{render(<ZipsinCheckApp/>);fireEvent.click(screen.getByRole('button',{name:'바로 체크'}));expect(screen.getByRole('heading',{name:/오늘 본 집 1 체크/})).toBeInTheDocument()});
it('새 집 등록에서 간단·상세를 선택한다',()=>{render(<ZipsinCheckApp/>);fireEvent.click(screen.getByRole('button',{name:'집 정보부터 등록'}));expect(screen.getByRole('heading',{name:'새 집 등록'})).toBeInTheDocument();expect(screen.getByRole('radio',{name:'간단하게'})).toBeChecked()});
it('v1 후보를 ID를 유지해 이어본다',async()=>{const candidate=createCandidate({id:'a',alias:'햇살 좋은 집',depth:'quick',now:'2026-10-13T00:00:00.000Z'});localStorage.setItem(CHECK_STORAGE_KEY,JSON.stringify({schemaVersion:1,candidates:[candidate],activeCandidateId:'a'}));render(<ZipsinCheckApp/>);const button=await screen.findByRole('button',{name:/햇살 좋은 집/});fireEvent.click(button);expect(screen.getByRole('heading',{name:/햇살 좋은 집 체크/})).toBeInTheDocument();expect(localStorage.getItem(CHECK_STORAGE_KEY)).toContain('햇살 좋은 집');expect(localStorage.getItem(CHECK_STORAGE_KEY_V2)).toContain('"id":"a"')});
it('손상된 v2를 빈 값으로 덮지 않는다',async()=>{localStorage.setItem(CHECK_STORAGE_KEY_V2,'{broken');render(<ZipsinCheckApp/>);expect(await screen.findByRole('alert')).toHaveTextContent(/원본은 지우지 않았어요/);expect(localStorage.getItem(CHECK_STORAGE_KEY_V2)).toBe('{broken')});
it('상세 수정을 취소해도 기존 체크가 유지된다',()=>{render(<ZipsinCheckApp/>);fireEvent.click(screen.getByRole('button',{name:'바로 체크'}));fireEvent.click(screen.getByRole('button',{name:'방문 끝내기'}));fireEvent.click(screen.getByRole('button',{name:'집 정보 수정'}));fireEvent.click(screen.getByRole('button',{name:'취소'}));expect(screen.getByRole('heading',{name:/다시 볼 것을 정리했어요/})).toBeInTheDocument()});
});
