import {beforeEach, describe, expect, it, vi} from 'vitest';

const remove = vi.fn();
const upload = vi.fn();
const createSignedUrl = vi.fn();
const maybeSingle = vi.fn();
const single = vi.fn();
const from = vi.fn();
const client = {
  from,
  storage: {from: vi.fn(() => ({remove, upload, createSignedUrl}))},
};

vi.mock('@/lib/supabase/server', () => ({getSupabaseServerClient: () => client}));
vi.mock('server-only', () => ({}));

const input = {title:'욕실 누수',home_alias:'테스트 주택 A',category:'plumbing' as const,status:'received' as const,description:'가상 수리 기록을 위한 상세 설명입니다.',repair_date:'2026-10-08'};

describe('repair repository failure handling', () => {
  beforeEach(() => {
    vi.clearAllMocks(); remove.mockResolvedValue({error:null}); upload.mockResolvedValue({error:null});
    from.mockReturnValue({select: vi.fn(() => ({eq: vi.fn(() => ({maybeSingle}))})),insert: vi.fn(() => ({select: vi.fn(() => ({single}))}))});
  });

  it('레코드 생성이 실패하면 먼저 올린 이미지를 제거한다', async () => {
    single.mockResolvedValue({data:null,error:new Error('insert failed')});
    const {createRepair}=await import('./repository');
    await expect(createRepair(input,new File(['image'],'test.png',{type:'image/png'}))).rejects.toThrow('insert failed');
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('이미지 서명 URL 생성 실패를 첨부 없음으로 숨기지 않는다', async () => {
    maybeSingle.mockResolvedValue({data:{id:'11111111-1111-4111-8111-111111111111',...input,image_path:'id/image.png',created_at:'',updated_at:''},error:null});
    createSignedUrl.mockResolvedValue({data:null,error:new Error('sign failed')});
    const {getRepair}=await import('./repository');
    await expect(getRepair('11111111-1111-4111-8111-111111111111')).rejects.toThrow('sign failed');
  });

  it('잘못된 id는 DB 조회 없이 없음으로 처리한다', async () => {
    const {getRepair}=await import('./repository');
    await expect(getRepair('not-a-uuid')).resolves.toBeNull();
    expect(from).not.toHaveBeenCalled();
  });

  it('이미지 없는 기록을 조회한다', async () => {
    const row={id:'11111111-1111-4111-8111-111111111111',...input,image_path:null,created_at:'',updated_at:''};
    maybeSingle.mockResolvedValue({data:row,error:null});
    const {getRepair}=await import('./repository');
    await expect(getRepair(row.id)).resolves.toMatchObject({title:input.title,image_path:null});
    expect(createSignedUrl).not.toHaveBeenCalled();
  });

  it('이미지와 레코드를 성공적으로 생성한다', async () => {
    single.mockResolvedValue({data:{id:'11111111-1111-4111-8111-111111111111',...input},error:null});
    const {createRepair}=await import('./repository');
    await expect(createRepair(input,new File(['image'],'test.png',{type:'image/png'}))).resolves.toMatchObject({title:input.title});
    expect(upload).toHaveBeenCalledOnce();
    expect(remove).not.toHaveBeenCalled();
  });

  it('이미지를 교체한 후 기존 객체를 제거한다', async () => {
    const current={id:'11111111-1111-4111-8111-111111111111',...input,image_path:'old.png',created_at:'',updated_at:''};
    maybeSingle.mockResolvedValue({data:current,error:null}); createSignedUrl.mockResolvedValue({data:{signedUrl:'https://example.com/old'},error:null});
    const updateSingle=vi.fn().mockResolvedValue({data:{...current,image_path:'new.png'},error:null});
    from.mockReturnValueOnce({select:vi.fn(()=>({eq:vi.fn(()=>({maybeSingle}))}))}).mockReturnValueOnce({update:vi.fn(()=>({eq:vi.fn(()=>({select:vi.fn(()=>({single:updateSingle}))}))}))});
    const {updateRepair}=await import('./repository');
    await expect(updateRepair(current.id,input,new File(['new'],'new.webp',{type:'image/webp'}),false)).resolves.toBeTruthy();
    expect(remove).toHaveBeenCalledWith(expect.arrayContaining(['old.png']));
  });

  it('레코드 삭제 후 연결 이미지를 제거한다', async () => {
    const current={id:'11111111-1111-4111-8111-111111111111',...input,image_path:'old.png',created_at:'',updated_at:''};
    maybeSingle.mockResolvedValue({data:current,error:null}); createSignedUrl.mockResolvedValue({data:{signedUrl:'https://example.com/old'},error:null});
    const deleteEq=vi.fn().mockResolvedValue({error:null});
    from.mockReturnValueOnce({select:vi.fn(()=>({eq:vi.fn(()=>({maybeSingle}))}))}).mockReturnValueOnce({delete:vi.fn(()=>({eq:deleteEq}))});
    const {deleteRepair}=await import('./repository');
    await expect(deleteRepair(current.id)).resolves.toEqual({deleted:true,cleanupWarning:false});
    expect(remove).toHaveBeenCalledWith(['old.png']);
  });

  it('DB 갱신 후 이전 파일 정리가 실패해도 현재 파일은 지우지 않고 부분 실패를 반환한다', async () => {
    const current={id:'11111111-1111-4111-8111-111111111111',...input,image_path:'old.png',created_at:'',updated_at:''};
    maybeSingle.mockResolvedValue({data:current,error:null}); createSignedUrl.mockResolvedValue({data:{signedUrl:'https://example.com/old'},error:null});
    const updateSingle=vi.fn().mockResolvedValue({data:{...current,image_path:'new.webp'},error:null});
    from.mockReturnValueOnce({select:vi.fn(()=>({eq:vi.fn(()=>({maybeSingle}))}))}).mockReturnValueOnce({update:vi.fn(()=>({eq:vi.fn(()=>({select:vi.fn(()=>({single:updateSingle}))}))}))});
    remove.mockRejectedValueOnce(new Error('cleanup failed'));
    const {updateRepair}=await import('./repository');
    const result=await updateRepair(current.id,input,new File(['new'],'new.webp',{type:'image/webp'}),false);
    expect(result).toMatchObject({cleanupWarning:true});
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith(['old.png']);
  });

  it('DB 삭제 후 파일 정리 실패를 부분 실패로 반환한다', async () => {
    const current={id:'11111111-1111-4111-8111-111111111111',...input,image_path:'old.png',created_at:'',updated_at:''};
    maybeSingle.mockResolvedValue({data:current,error:null}); createSignedUrl.mockResolvedValue({data:{signedUrl:'https://example.com/old'},error:null});
    from.mockReturnValueOnce({select:vi.fn(()=>({eq:vi.fn(()=>({maybeSingle}))}))}).mockReturnValueOnce({delete:vi.fn(()=>({eq:vi.fn().mockResolvedValue({error:null})}))});
    remove.mockRejectedValueOnce(new Error('cleanup failed'));
    const {deleteRepair}=await import('./repository');
    await expect(deleteRepair(current.id)).resolves.toEqual({deleted:true,cleanupWarning:true});
  });

  it('검색과 상태로 목록을 페이지네이션한다', async () => {
    const result=Promise.resolve({data:[{id:'1',...input}],error:null,count:1});
    const query={eq:vi.fn(()=>query),or:vi.fn(()=>result)} as {eq:ReturnType<typeof vi.fn>;or:ReturnType<typeof vi.fn>};
    const range=vi.fn(()=>query); const order=vi.fn(()=>({range}));
    from.mockReturnValue({select:vi.fn(()=>({order}))});
    const {listRepairs}=await import('./repository');
    await expect(listRepairs({page:1,status:'received',query:'누수'})).resolves.toMatchObject({count:1});
    expect(query.eq).toHaveBeenCalledWith('status','received');
    expect(query.or).toHaveBeenCalled();
  });

  it('조건 없이 전체 목록을 조회한다', async () => {
    const result={data:[],error:null,count:0}; const range=vi.fn().mockResolvedValue(result); const order=vi.fn(()=>({range}));
    from.mockReturnValue({select:vi.fn(()=>({order}))});
    const {listRepairs}=await import('./repository');
    await expect(listRepairs({page:2,status:'all',query:''})).resolves.toEqual({records:[],count:0});
    expect(range).toHaveBeenCalledWith(6,11);
  });
});
