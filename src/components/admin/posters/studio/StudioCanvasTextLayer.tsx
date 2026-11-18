'use client';

import React from 'react';
import type { PosterTextOverlay } from '@/types/index';
import type { ResizeHandle, ResizeSession, SelectedEntity } from '@/lib/posters/studio-types';
import { StudioTransformHandles } from './StudioTransformHandles';

interface StudioCanvasTextLayerProps {
  readonly textOverlays: readonly PosterTextOverlay[];
  readonly selectedEntity: SelectedEntity | null;
  readonly selectedLayerKeys: readonly string[];
  readonly draggingTextId: string | null;
  readonly isAspectLocked: boolean;
  readonly isItemLocked: (item: { readonly is_locked?: boolean | undefined; readonly layer_folder_id?: string | undefined } | null | undefined) => boolean;
  readonly onTextPointerDown: (e: React.PointerEvent, textId: string) => void;
  readonly onStartResizing: (
    e: React.PointerEvent,
    type: ResizeSession['type'],
    id: string,
    handle: ResizeHandle,
    initialProps: { pos_x: number; pos_y: number; width_percent: number; height_percent: number },
  ) => void;
}

function resolveTextClasses(ov: PosterTextOverlay) {
  const fontFamilyClass =
    ov.font_family === 'serif' ? 'font-serif'
    : ov.font_family === 'mono' ? 'font-mono'
    : ov.font_family === 'traditional' ? 'font-serif tracking-wider'
    : 'font-sans';
  const fontSizeClass =
    ov.font_size === 'sm' ? 'text-xs'
    : ov.font_size === 'lg' ? 'text-base sm:text-lg'
    : ov.font_size === 'xl' ? 'text-lg sm:text-xl'
    : ov.font_size === '2xl' ? 'text-xl sm:text-2xl'
    : ov.font_size === '3xl' ? 'text-2xl sm:text-3xl'
    : 'text-sm';
  const isTransparentBg = ov.bg_color === 'transparent' || ov.bg_style === 'transparent';
  const customBgColor = isTransparentBg ? 'transparent' : ov.bg_color;
  const bgClass = isTransparentBg ? 'bg-transparent border-0 shadow-none'
    : customBgColor ? 'border border-white/20 shadow-2xl backdrop-blur-md'
    : ov.bg_style === 'glass' ? 'bg-slate-900/80 backdrop-blur-md border border-white/20 shadow-2xl'
    : ov.bg_style === 'emerald' ? 'bg-emerald-950/90 border border-emerald-400/50 shadow-2xl'
    : ov.bg_style === 'gold' ? 'bg-black/90 border border-amber-400/60 shadow-2xl'
    : 'bg-black/85 backdrop-blur-md border border-white/20 shadow-2xl';
  const textAlignClass = ov.text_align === 'left' ? 'text-left pl-3 pr-8' : ov.text_align === 'right' ? 'text-right pr-3 pl-8' : 'text-center px-6';
  return { fontFamilyClass, fontSizeClass, isTransparentBg, customBgColor, bgClass, textAlignClass };
}

/** Renders draggable, rotatable, 8-point resizable text overlay banners on the Stage canvas. */
export function StudioCanvasTextLayer({
  textOverlays,
  selectedEntity,
  selectedLayerKeys,
  draggingTextId,
  isAspectLocked,
  isItemLocked,
  onTextPointerDown,
  onStartResizing,
}: StudioCanvasTextLayerProps) {
  return (
    <>
      {textOverlays.map((ov, ovIdx) => {
        if (ov.is_hidden) return null;
        const isSelected = (selectedEntity?.type === 'text' && selectedEntity.id === ov.id) || selectedLayerKeys.includes(`text:${ov.id}`);
        const isDraggingThis = draggingTextId === ov.id;
        const topPct = ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85;
        const leftPct = ov.pos_x !== undefined ? ov.pos_x : 50;
        const locked = isItemLocked(ov);
        const s = resolveTextClasses(ov);
        const widthClass = ov.width_mode === 'full' ? 'w-[92%]' : ov.width_mode === 'custom' && ov.width_percent ? '' : 'w-fit max-w-[95%]';
        const widthStyle = ov.width_mode === 'custom' && ov.width_percent ? { width: `${ov.width_percent}%` } : undefined;

        return (
          <div
            key={ov.id}
            onPointerDown={(e) => onTextPointerDown(e, ov.id)}
            style={{
              position: 'absolute', top: `${topPct}%`, left: `${leftPct}%`,
              transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
              touchAction: 'none', zIndex: isDraggingThis ? 999 : ov.z_index ?? ovIdx + 50,
              ...widthStyle,
            }}
            className={`absolute select-none transition-shadow ${widthClass} ${locked ? 'cursor-default' : 'cursor-move'} ${
              isSelected || isDraggingThis ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-black/50 shadow-2xl' : 'hover:ring-1 hover:ring-white/50'
            }`}
          >
            {isSelected && !locked && selectedLayerKeys.length === 1 && (
              <StudioTransformHandles
                accent="cyan"
                isAspectLocked={isAspectLocked}
                onResizeStart={(e, h) =>
                  onStartResizing(e, 'text', ov.id, h, {
                    pos_x: leftPct, pos_y: topPct,
                    width_percent: ov.width_mode === 'custom' && ov.width_percent ? ov.width_percent : 40,
                    height_percent: 10,
                  })
                }
              />
            )}

            <div
              className={`inline-block w-full min-w-[150px] py-2.5 rounded-lg transition-all ${s.bgClass} ${s.fontFamilyClass} ${s.fontSizeClass} ${
                ov.is_bold ?? true ? 'font-bold' : 'font-normal'
              } ${ov.is_italic ? 'italic' : ''} ${ov.is_underline ? 'underline' : ''} ${s.textAlignClass}`}
              style={{
                color: ov.text_color || '#ffffff',
                backgroundColor: s.isTransparentBg ? 'transparent' : s.customBgColor || (ov.bg_style === 'emerald' ? '#064e3b' : ov.bg_style === 'gold' ? '#78350f' : '#000000ee'),
              }}
            >
              {ov.text}
            </div>
          </div>
        );
      })}
    </>
  );
}

