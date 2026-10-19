import type { BookingStatus } from '@/features/zipsin-clean/domain/constants';
import type { QuoteInput } from '@/features/zipsin-clean/domain/pricing';

export type CleanPhoto = { id: string; kind: 'before' | 'after' | 'block' | 'record'; url: string | null };
export type PartnerOption = { id: string; name: string; kind: 'company' | 'individual'; area: string; team: string; checks: string[]; completedCount: number; samplePhotos: CleanPhoto[] };

type BookingBase = {
  id: string; status: BookingStatus; service: 'move_in' | 'tidy'; facts: QuoteInput; areaPyeong: number; grade: number; people: number; hours: number;
  priceWon: number; includes: string[]; areaDistrict: string; serviceDate: string; startHour: number; arrivalHour: number | null;
  requests: string[]; partnerNote: string | null; portfolioConsent: boolean; photos: CleanPhoto[];
};
export type CustomerBooking = BookingBase & { partnerName: string; detailAddress: string; memo: string; blockReason: string | null };
export type PartnerJob = BookingBase & { memo: string; detailAddress: string | null; contactPhone: string | null };
export type MyRecord = { id: string; doneMonth: string; service: string; partnerName: string; areaDistrict: string; priceWon: number | null; memo: string; photos: CleanPhoto[] };
export type VisitRequest = { id: string; kind: 'move_in' | 'tidy' | 'special'; special: string[]; note: string; areaDistrict: string; visitDate: string; slot: string; contactPhone: string; status: string; createdAt: string };
export type AdminPartner = { id: string; name: string; kind: 'company' | 'individual'; area: string; team: string; checks: string[]; status: 'active' | 'suspended' | 'red_card'; memberCount: number };
export type AdminBooking = { id: string; status: BookingStatus; partnerName: string; areaDistrict: string; serviceDate: string; priceWon: number; blockReason: string | null; blockNote: string | null; createdAt: string };
