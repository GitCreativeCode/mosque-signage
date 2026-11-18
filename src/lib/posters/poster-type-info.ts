import type { PosterWithStatus } from '@/types/index';
import { isVideoMedia } from '@/lib/engine/video-engine';

export function getPosterTypeInfo(poster: PosterWithStatus): {
  type: 'image' | 'video' | 'notice' | 'composite';
  label: string;
} {
  if (poster.layout_config || poster.media_type === 'composite') {
    return { type: 'composite', label: 'Multi-Asset' };
  }
  if (poster.media_type === 'video' || isVideoMedia(undefined, poster.image_path)) {
    const loopStr = poster.video_loop_count && poster.video_loop_count > 1 ? ` (${poster.video_loop_count}x)` : '';
    return { type: 'video', label: `Video${loopStr}` };
  }
  if (poster.image_path.includes('announcement-') || poster.image_path.endsWith('.svg')) {
    return { type: 'notice', label: 'Notice' };
  }
  return { type: 'image', label: 'Image' };
}

