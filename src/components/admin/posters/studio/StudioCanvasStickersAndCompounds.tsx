'use client';

import React from 'react';
import type { PosterCanvasSticker, PosterCompoundLayer } from '@/types/index';
import type { ResizeHandle, ResizeSession, SelectedEntity } from '@/lib/posters/studio-types';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { StudioTransformHandles } from './StudioTransformHandles';

interface StudioCanvasStickersAndCompoundsProps {
  readonly stickers: readonly PosterCanvasSticker[];
  readonly compoundLayers: readonly PosterCompoundLayer[];
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly draggingStickerId: string | null;
  readonly draggingCompoundId: string | null;
  readonly isAspectLocked: boolean;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onStickerPointerDown: (e: React.PointerEvent, stk: PosterCanvasSticker, idx: number) => void;
  readonly onCompoundPointerDown: (e: React.PointerEvent, compoundId: string) => void;
  readonly onStartResizing: (
    e: React.PointerEvent,
    type: ResizeSession['type'],
    id: string,
    handle: ResizeHandle,
    initialProps: { pos_x: number; pos_y: number; width_percent: number; height_percent: number },
  ) => void;
}

/** Renders interactive Islamic stickers/ribbons and merged compound layer containers on the Stage canvas. */
export function StudioCanvasStickersAndCompounds({
  stickers,
  compoundLayers,
  selectedEntity,
  selectedLayerKeys,
  draggingStickerId,
  draggingCompoundId,
  isAspectLocked,
  isItemLocked,
  onStickerPointerDown,
  onCompoundPointerDown,
  onStartResizing,
}: StudioCanvasStickersAndCompoundsProps) {
  return (
    <>
      {stickers.map((stk, idx) => {
        if (stk.is_hidden) return null;
        const isSelected = (selectedEntity?.type === 'sticker' && selectedEntity.id === stk.id) || selectedLayerKeys.includes(`sticker:${stk.id}`);
        const locked = isItemLocked(stk);
        return (
          <div
            key={stk.id}
            onPointerDown={(e) => onStickerPointerDown(e, stk, idx)}
            style={{
              position: 'absolute', left: `${stk.pos_x}%`, top: `${stk.pos_y}%`,
              width: `${stk.width_percent}%`, height: `${stk.height_percent}%`,
              transform: `translate(-50%, -50%) rotate(${stk.rotation ?? 0}deg)`,
              zIndex: draggingStickerId === stk.id ? 999 : stk.z_index ?? idx + 35,
            }}
            className={`group select-none transition-shadow ${locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isSelected ? 'ring-2 ring-amber-400 shadow-2xl' : 'hover:ring-1 hover:ring-amber-400/50'}`}
          >
            {isSelected && !locked && selectedLayerKeys.length === 1 && (
              <StudioTransformHandles
                accent="amber"
                isAspectLocked={isAspectLocked}
                onResizeStart={(e, h) => onStartResizing(e, 'sticker', stk.id, h, { pos_x: stk.pos_x, pos_y: stk.pos_y, width_percent: stk.width_percent, height_percent: stk.height_percent })}
              />
            )}
            <div className="w-full h-full relative" style={{ transform: `scale(${stk.flip_x ? -1 : 1}, ${stk.flip_y ? -1 : 1})` }}>
              <IslamicStickerGraphic type={stk.type} badgeText={stk.badge_text} badgeVariant={stk.badge_variant} colorOverride={stk.color_override} className="w-full h-full pointer-events-none" />
            </div>
          </div>
        );
      })}

      {compoundLayers.map((comp) => {
        if (comp.is_hidden) return null;
        const isSelected = (selectedEntity?.type === 'compound' && selectedEntity.id === comp.id) || selectedLayerKeys.includes(`compound:${comp.id}`);
        const locked = isItemLocked(comp);
        return (
          <div
            key={comp.id}
            onPointerDown={(e) => onCompoundPointerDown(e, comp.id)}
            style={{
              position: 'absolute', left: `${comp.pos_x}%`, top: `${comp.pos_y}%`,
              width: `${comp.width_percent}%`, height: `${comp.height_percent}%`,
              transform: `translate(-50%, -50%) rotate(${comp.rotation ?? 0}deg)`,
              zIndex: draggingCompoundId === comp.id ? 999 : comp.z_index ?? 30,
            }}
            className={`group select-none transition-shadow ${locked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'} ${isSelected ? 'ring-2 ring-indigo-400 shadow-2xl' : 'hover:ring-1 hover:ring-indigo-400/50'}`}
          >
            {isSelected && !locked && selectedLayerKeys.length === 1 && (
              <StudioTransformHandles
                accent="cyan"
                isAspectLocked={isAspectLocked}
                onResizeStart={(e, h) => onStartResizing(e, 'compound', comp.id, h, { pos_x: comp.pos_x, pos_y: comp.pos_y, width_percent: comp.width_percent, height_percent: comp.height_percent })}
              />
            )}
            <div className="relative w-full h-full pointer-events-none" style={{ transform: `scale(${comp.flip_x ? -1 : 1}, ${comp.flip_y ? -1 : 1})` }}>
              {comp.merged_children.slots?.filter((s) => !s.is_hidden).map((s) => (
                <div key={s.id} style={{ position: 'absolute', left: `${s.pos_x ?? 50}%`, top: `${s.pos_y ?? 50}%`, width: `${s.width_percent ?? 50}%`, height: `${s.height_percent ?? 50}%`, transform: `translate(-50%, -50%) rotate(${s.rotation ?? 0}deg)` }} className="overflow-hidden shadow-md">
                  {s.type === 'video' ? <video src={`${s.asset_path}#t=0.001`} muted playsInline className="w-full h-full object-cover" />
                    : s.type === 'notice' ? <div className="w-full h-full p-2 bg-emerald-950 text-white text-xs flex items-center justify-center"><span>{s.notice_headline || 'Notice'}</span></div>
                    : <img src={s.asset_path} alt="" className="w-full h-full object-cover" />}
                </div>
              ))}
              {comp.merged_children.stickers?.filter((stk) => !stk.is_hidden).map((stk) => (
                <div key={stk.id} style={{ position: 'absolute', left: `${stk.pos_x}%`, top: `${stk.pos_y}%`, width: `${stk.width_percent}%`, height: `${stk.height_percent}%`, transform: `translate(-50%, -50%) rotate(${stk.rotation ?? 0}deg)` }}>
                  <IslamicStickerGraphic type={stk.type} badgeText={stk.badge_text} badgeVariant={stk.badge_variant} colorOverride={stk.color_override} />
                </div>
              ))}
              {comp.merged_children.text_overlays?.filter((t) => !t.is_hidden).map((t) => {
                const isTrans = t.bg_color === 'transparent' || t.bg_style === 'transparent';
                const ff = t.font_family === 'serif' ? 'font-serif' : t.font_family === 'mono' ? 'font-mono' : 'font-sans';
                const fs = t.font_size === 'sm' ? 'text-xs' : t.font_size === 'lg' ? 'text-lg' : t.font_size === 'xl' ? 'text-xl' : 'text-sm';
                const ta = t.text_align === 'left' ? 'text-left pl-2 pr-6' : t.text_align === 'right' ? 'text-right pr-2 pl-6' : 'text-center px-4';
                return (
                  <div
                    key={t.id}
                    style={{
                      position: 'absolute', left: `${t.pos_x ?? 50}%`, top: `${t.pos_y ?? 50}%`, width: t.width_percent ? `${t.width_percent}%` : 'auto',
                      transform: `translate(-50%, -50%) rotate(${t.rotation ?? 0}deg)`, color: t.text_color || '#ffffff',
                      backgroundColor: isTrans ? 'transparent' : t.bg_color || (t.bg_style === 'emerald' ? '#064e3b' : t.bg_style === 'gold' ? '#78350f' : '#000000ee'),
                    }}
                    className={`inline-block py-1 rounded shadow-md ${ff} ${fs} ${t.is_bold ?? true ? 'font-bold' : 'font-normal'} ${t.is_italic ? 'italic' : ''} ${t.is_underline ? 'underline' : ''} ${ta}`}
                  >
                    {t.text}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </>
  );
}

