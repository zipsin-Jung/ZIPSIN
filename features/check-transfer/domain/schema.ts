import {z} from 'zod';

export const requestKeySchema=z.string().min(8).max(128);
export const allowedPhotoMimes=new Set(['image/jpeg','image/png','image/webp']);
export const MAX_TRANSFER_PHOTO_BYTES=10*1024*1024;
const transferPhotoSchema=z.object({id:z.string().min(1).max(128),candidateId:z.string().min(1).max(128),itemId:z.string().min(1).max(80),mime:z.string().min(1).max(100),bytes:z.number().int().nonnegative().max(MAX_TRANSFER_PHOTO_BYTES)}).passthrough();
export const transferTextSchema=z.object({
  schemaVersion:z.literal(1),requestKey:requestKeySchema,createdAt:z.iso.datetime(),
  candidates:z.array(z.object({localCandidateId:z.string().min(1).max(128),alias:z.string().min(1).max(80),answers:z.array(z.object({itemId:z.string().min(1).max(80)}).passthrough()).max(32),photos:z.array(transferPhotoSchema).max(64)}).passthrough()).min(1).max(3),
  expected:z.object({candidates:z.number().int().nonnegative(),answers:z.number().int().nonnegative(),photos:z.number().int().nonnegative()}),warnings:z.array(z.string().max(240)).max(32),
}).passthrough();
