export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const ATTACHMENT_MAX_COUNT = 10;
export const ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'application/pdf'] as const;

type FileMetadata = { name: string; type: string; size: number };
export type AttachmentValidationResult = { ok: true } | { ok: false; error: string; index?: number };

export function validateAttachmentSelection(files: FileMetadata[]): AttachmentValidationResult {
  if (files.length === 0) return { ok: false, error: '파일을 선택해 주세요.' };
  if (files.length > ATTACHMENT_MAX_COUNT) return { ok: false, error: '한 기록에는 파일을 10개까지 올릴 수 있습니다.' };
  for (const [index, file] of files.entries()) {
    if (!file.name.trim() || file.name.length > 200 || /[\u0000-\u001f\u007f]/.test(file.name)) return { ok: false, error: '파일 이름을 확인해 주세요.', index };
    if (!(ATTACHMENT_TYPES as readonly string[]).includes(file.type)) return { ok: false, error: 'JPG, PNG, HEIC, PDF 파일만 올릴 수 있습니다.', index };
    if (file.size <= 0 || file.size > ATTACHMENT_MAX_BYTES) return { ok: false, error: '파일은 개당 20MB 이하여야 합니다.', index };
  }
  return { ok: true };
}
