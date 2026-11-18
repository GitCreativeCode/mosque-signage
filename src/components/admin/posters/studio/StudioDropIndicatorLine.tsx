'use client';

import React from 'react';
import type { DropIndicatorState } from '@/lib/posters/studio-types';
import type { StudioLayerRowItem } from '@/lib/posters/studio-layer-items';
import { FileText, Layers, Star, Tag, Type, Video } from 'lucide-react';

interface StudioDropIndicatorLineProps {
  readonly dropIndicator: DropIndicatorState | null;
  readonly targetKey: string;
}

/** Amber visual drop indicator line rendered above or below hovered layer rows and folders. */
export function StudioDropIndicatorLine({
  dropIndicator,
  targetKey,
}: StudioDropIndicatorLineProps) {
  if (!dropIndicator || dropIndicator.targetKey !== targetKey) return null;
  if (dropIndicator.position !== 'before' && dropIndicator.position !== 'after') return null;

  const posClass = dropIndicator.position === 'before' ? '-top-[2px]' : '-bottom-[2px]';
  return (
    <div
      className={`absolute ${posClass} left-0 right-0 h-[3px] bg-amber-400 rounded-full z-40 shadow-[0_0_8px_rgba(251,191,36,0.9)] pointer-events-none flex items-center`}
    >
      <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -ml-1 border-2 border-neutral-900 shadow" />
    </div>
  );
}

/** Compact icon/thumbnail badge for a Studio layer row. */
export function StudioLayerRowThumbnail({ item }: { readonly item: StudioLayerRowItem }) {
  if (item.type === 'slot') {
    if (item.slot?.type === 'video') {
      return (
        <div className="relative w-6 h-6 rounded bg-black overflow-hidden shrink-0 border border-white/20">
          <video src={`${item.slot.asset_path}#t=0.001`} muted playsInline className="w-full h-full object-cover" />
          <Video className="absolute bottom-0 right-0 w-2.5 h-2.5 text-white/90 drop-shadow" />
        </div>
      );
    }
    if (item.slot?.type === 'notice') return <FileText className="w-4 h-4 text-emerald-500 shrink-0" />;
    return <img src={item.slot?.asset_path} alt="" className="w-6 h-6 rounded object-cover shrink-0 border border-[var(--admin-border)]" />;
  }
  if (item.type === 'sticker') {
    return item.sticker?.type === 'badge_custom'
      ? <Tag className="w-4 h-4 text-amber-400 shrink-0" />
      : <Star className="w-4 h-4 text-amber-400 shrink-0" />;
  }
  if (item.type === 'text') return <Type className="w-4 h-4 text-cyan-400 shrink-0" />;
  return <Layers className="w-4 h-4 text-indigo-400 shrink-0" />;
}
