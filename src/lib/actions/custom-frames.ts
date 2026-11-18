'use server';

import {
  readCustomFramesMeta,
  removeCustomFrameFile,
  storeCustomFrameFile,
  type CustomFrameItem,
  type UploadCustomFrameInput,
} from '@/lib/posters/custom-frames-store';
import { requireAdminAuth } from './auth';

export async function uploadCustomFrame(input: UploadCustomFrameInput): Promise<CustomFrameItem> {
  await requireAdminAuth();
  return storeCustomFrameFile(input);
}

export async function getCustomFrames(): Promise<CustomFrameItem[]> {
  return readCustomFramesMeta();
}

export async function deleteCustomFrame(frameId: string): Promise<void> {
  await requireAdminAuth();
  await removeCustomFrameFile(frameId);
}

