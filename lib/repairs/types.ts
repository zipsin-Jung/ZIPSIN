export const repairCategories = ['plumbing', 'electrical', 'heating', 'interior', 'other'] as const;
export const repairStatuses = ['received', 'in_progress', 'completed'] as const;
export type RepairCategory = (typeof repairCategories)[number];
export type RepairStatus = (typeof repairStatuses)[number];

export const categoryLabels: Record<RepairCategory, string> = {
  plumbing: '누수·배관', electrical: '전기', heating: '보일러·난방', interior: '도배·마감', other: '기타',
};
export const statusLabels: Record<RepairStatus, string> = {
  received: '접수', in_progress: '처리 중', completed: '완료',
};

export type RepairRecord = {
  id: string;
  title: string;
  home_alias: string;
  category: RepairCategory;
  status: RepairStatus;
  description: string;
  repair_date: string;
  image_path: string | null;
  created_at: string;
  updated_at: string;
  image_url?: string | null;
};

export type RepairInput = Omit<RepairRecord, 'id' | 'image_path' | 'created_at' | 'updated_at' | 'image_url'>;
export type RepairActionState = {message?: string; errors?: Record<string, string>; values?: Record<string, string>};
