import { z } from 'zod';
import { MEMO_MAX, PHONE_PATTERN, RECORD_SERVICES, REQUEST_CHIPS, SPECIAL_KINDS } from '@/features/zipsin-clean/domain/constants';
import { AREA_MAX, AREA_MIN } from '@/features/zipsin-clean/domain/pricing';
import { START_HOURS } from '@/features/zipsin-clean/domain/schedule';

const phone = z.string().trim().regex(PHONE_PATTERN, '연락처를 010-0000-0000처럼 적어 주세요.');
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const quoteInputSchema = z.object({
  service: z.enum(['move_in', 'tidy']),
  areaPyeong: z.number().min(AREA_MIN).max(AREA_MAX),
  rooms: z.number().int().min(1).max(8),
  baths: z.number().int().min(1).max(5),
  balcony: z.enum(['expanded', 'normal', 'full', 'unknown']),
  builtAge: z.enum(['new', 'mid', 'old', 'unknown']),
  occupancy: z.enum(['just_left', 'vacant_long', 'new_build', 'unknown']),
  pets: z.enum(['yes', 'no', 'unknown']),
  smoking: z.enum(['yes', 'no', 'unknown']),
  tidyHours: z.union([z.literal(2), z.literal(3), z.literal(4)]).optional(),
});

export const bookingSchema = z.object({
  input: quoteInputSchema,
  partnerId: z.uuid(),
  serviceDate: isoDate,
  startHour: z.number().int().refine((value) => (START_HOURS as readonly number[]).includes(value), '시작 시간을 골라 주세요.'),
  arrivalHour: z.number().int().min(10).max(20).nullable(),
  areaDistrict: z.string().trim().min(1, '주소를 적어 주세요.').max(40),
  detailAddress: z.string().trim().min(1, '주소를 적어 주세요.').max(100),
  contactPhone: phone,
  requests: z.array(z.enum(REQUEST_CHIPS)).max(REQUEST_CHIPS.length),
  memo: z.string().trim().max(MEMO_MAX),
  idempotencyKey: z.uuid(),
});
export type BookingPayload = z.infer<typeof bookingSchema>;

export const visitSchema = z.object({
  kind: z.enum(['move_in', 'tidy', 'special']),
  special: z.array(z.enum(SPECIAL_KINDS)).max(SPECIAL_KINDS.length),
  note: z.string().trim().max(MEMO_MAX),
  areaDistrict: z.string().trim().min(1, '주소를 구·동까지 적어 주세요.').max(40),
  visitDate: isoDate,
  slot: z.enum(['오전', '오후']),
  contactPhone: phone,
}).superRefine((value, context) => {
  if (value.kind === 'special' && value.special.length === 0) context.addIssue({ code: 'custom', path: ['special'], message: '어떤 특수 청소인지 골라 주세요.' });
  if (value.special.includes('기타') && !value.note) context.addIssue({ code: 'custom', path: ['note'], message: '기타 상황을 적어 주세요.' });
});
export type VisitPayload = z.infer<typeof visitSchema>;

export const recordSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, '언제, 어느 업체, 어디인지 적어 주세요.'),
  service: z.enum(RECORD_SERVICES),
  partnerName: z.string().trim().min(1, '언제, 어느 업체, 어디인지 적어 주세요.').max(40),
  areaDistrict: z.string().trim().min(1, '언제, 어느 업체, 어디인지 적어 주세요.').max(40),
  priceWon: z.number().int().min(1).max(100_000_000).nullable(),
  memo: z.string().trim().max(MEMO_MAX),
});
export type RecordPayload = z.infer<typeof recordSchema>;

export const partnerSchema = z.object({
  name: z.string().trim().min(1, '업체 이름을 적어 주세요.').max(40),
  kind: z.enum(['company', 'individual']),
  area: z.string().trim().max(40),
  team: z.string().trim().max(40),
  checks: z.array(z.string().trim().min(1).max(20)).max(6),
});
export type PartnerPayload = z.infer<typeof partnerSchema>;

export type BookingAction = 'cancel' | 'approve' | 'request_redo' | 'accept' | 'decline' | 'start' | 'finish' | 'report_block' | 'note' | 'confirm_block';
export const bookingActionSchema = z.object({
  bookingId: z.uuid(),
  action: z.enum(['cancel', 'approve', 'request_redo', 'accept', 'decline', 'start', 'finish', 'report_block', 'note', 'confirm_block']),
  note: z.string().trim().max(MEMO_MAX).optional(),
  reason: z.string().trim().max(40).optional(),
  answers: z.record(z.string(), z.enum(['yes', 'no'])).optional(),
  consent: z.boolean().optional(),
});
export type BookingActionPayload = z.infer<typeof bookingActionSchema>;
