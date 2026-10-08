import {z} from 'zod';
import {repairCategories, repairStatuses, type RepairInput, type RepairStatus} from './types';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const repairSchema = z.object({
  title: z.string().trim().min(2, '제목을 2자 이상 입력해 주세요.').max(80, '제목은 80자까지 입력할 수 있어요.'),
  home_alias: z.string().trim().min(2, '집 별칭을 2자 이상 입력해 주세요.').max(40, '집 별칭은 40자까지 입력할 수 있어요.'),
  category: z.enum(repairCategories, {message: '수리 종류를 선택해 주세요.'}),
  status: z.enum(repairStatuses, {message: '진행 상태를 선택해 주세요.'}),
  description: z.string().trim().min(10, '설명을 10자 이상 입력해 주세요.').max(1000, '설명은 1000자까지 입력할 수 있어요.'),
  repair_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '유효한 수리일을 입력해 주세요.').refine(isRealDate, '유효한 수리일을 입력해 주세요.'),
});

export type ValidatedRepair = {data: RepairInput; image: File | null; removeImage: boolean};
export type ValidationResult = {success: true} & ValidatedRepair | {success: false; errors: Record<string, string>; values: Record<string, string>};

export function validateRepairFormData(formData: FormData): ValidationResult {
  const values = {
    title: String(formData.get('title') ?? ''), homeAlias: String(formData.get('homeAlias') ?? ''),
    category: String(formData.get('category') ?? ''), status: String(formData.get('status') ?? ''),
    description: String(formData.get('description') ?? ''), repairDate: String(formData.get('repairDate') ?? ''),
  };
  const parsed = repairSchema.safeParse({title: values.title, home_alias: values.homeAlias, category: values.category, status: values.status, description: values.description, repair_date: values.repairDate});
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const issue of parsed.error.issues) errors[issue.path[0] === 'home_alias' ? 'homeAlias' : issue.path[0] === 'repair_date' ? 'repairDate' : String(issue.path[0])] ??= issue.message;
  const rawImage = formData.get('image');
  const image = rawImage instanceof File && rawImage.size > 0 ? rawImage : null;
  if (image && !ALLOWED_IMAGE_TYPES.includes(image.type)) errors.image = 'JPG, PNG, WebP 이미지만 올릴 수 있어요.';
  if (image && image.size > MAX_IMAGE_SIZE) errors.image = '이미지는 5MB 이하만 올릴 수 있어요.';
  if (!parsed.success || Object.keys(errors).length) return {success: false, errors, values};
  return {success: true, data: parsed.data, image, removeImage: formData.get('removeImage') === 'true'};
}

export function parseListParams(params: {page?: string; status?: string; query?: string}) {
  const rawPage = Number.parseInt(params.page ?? '1', 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const status: RepairStatus | 'all' = repairStatuses.includes(params.status as RepairStatus) ? params.status as RepairStatus : 'all';
  return {page, status, query: (params.query ?? '').trim().slice(0, 80)};
}

function isRealDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}
