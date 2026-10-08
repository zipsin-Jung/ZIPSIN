import {describe, expect, it} from 'vitest';
import {parseListParams, validateRepairFormData} from './schema';

function validForm() {
  const data = new FormData();
  data.set('title', '욕실 천장 누수');
  data.set('homeAlias', '테스트 주택 A');
  data.set('category', 'plumbing');
  data.set('status', 'received');
  data.set('description', '가상 수리 기록을 확인하기 위한 설명입니다.');
  data.set('repairDate', '2026-10-08');
  return data;
}

describe('validateRepairFormData', () => {
  it('유효한 가상 기록을 정규화한다', () => {
    const result = validateRepairFormData(validForm());
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.home_alias).toBe('테스트 주택 A');
  });

  it('선택 이미지가 없고 삭제를 선택한 입력을 처리한다', () => {
    const data = validForm(); data.set('removeImage', 'true');
    const result = validateRepairFormData(data);
    expect(result.success).toBe(true);
    if (result.success) expect(result).toMatchObject({image:null, removeImage:true});
  });

  it('허용된 이미지를 입력에 포함한다', () => {
    const data = validForm(); data.set('image', new File(['image'], 'test.jpg', {type:'image/jpeg'}));
    const result = validateRepairFormData(data);
    expect(result.success).toBe(true);
    if (result.success) { expect(result.image?.name).toBe('test.jpg'); expect(result.removeImage).toBe(false); }
  });

  it('빈 필수값과 짧은 설명을 필드 오류로 반환한다', () => {
    const data = validForm();
    data.set('title', '');
    data.set('description', '짧음');
    const result = validateRepairFormData(data);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors.title).toBeTruthy();
      expect(result.errors.description).toBeTruthy();
    }
  });

  it('실제 달력에 없는 날짜를 거부한다', () => {
    const data = validForm();
    data.set('repairDate', '2026-02-30');
    const result = validateRepairFormData(data);
    expect(result.success).toBe(false);
    if (!result.success) expect(result.errors.repairDate).toBeTruthy();
  });

  it('허용하지 않는 파일과 5MB 초과 파일을 거부한다', () => {
    const wrong = validForm();
    wrong.set('image', new File(['x'], 'note.txt', {type: 'text/plain'}));
    const wrongResult = validateRepairFormData(wrong);
    expect(wrongResult.success).toBe(false);

    const large = validForm();
    large.set('image', new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', {type: 'image/png'}));
    const largeResult = validateRepairFormData(large);
    expect(largeResult.success).toBe(false);
    if (!largeResult.success) expect(largeResult.errors.image).toContain('5MB');
  });
});

describe('parseListParams', () => {
  it('잘못된 페이지와 상태를 안전한 기본값으로 바꾼다', () => {
    expect(parseListParams({page: '-8', status: 'unknown', query: '  누수  '})).toEqual({
      page: 1,
      status: 'all',
      query: '누수',
    });
  });

  it('유효한 페이지와 상태를 유지하고 긴 검색어를 제한한다', () => {
    const result = parseListParams({page:'3',status:'completed',query:'x'.repeat(100)});
    expect(result.page).toBe(3); expect(result.status).toBe('completed'); expect(result.query).toHaveLength(80);
  });

  it('파라미터가 없으면 첫 페이지 전체 목록을 사용한다', () => {
    expect(parseListParams({})).toEqual({page:1,status:'all',query:''});
  });
});
