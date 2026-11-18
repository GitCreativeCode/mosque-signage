'use client';

import React from 'react';
import type {
  PosterCanvasSticker,
  PosterCompoundLayer,
  PosterLayoutConfig,
  PosterTextOverlay,
} from '@/types/index';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { SlotPresenter } from './SlotPresenter';
import {
  resolveFontClass,
  resolveOverlayBgClass,
  resolveTextSizeClass,
} from './overlay-styles';

function StickerListLayer({ stickers, defaultZ }: { stickers?: readonly PosterCanvasSticker[] | undefined; defaultZ: number }) {
  return (
    <>
      {stickers?.map((stk) => {
        if (stk.is_hidden) return null;
        return (
          <div
            key={stk.id}
            style={{
              position: 'absolute',
              left: `${stk.pos_x}%`,
              top: `${stk.pos_y}%`,
              width: `${stk.width_percent}%`,
              height: `${stk.height_percent}%`,
              transform: `translate(-50%, -50%) rotate(${stk.rotation ?? 0}deg) scale(${stk.flip_x ? -1 : 1}, ${stk.flip_y ? -1 : 1})`,
              zIndex: stk.z_index ?? defaultZ,
            }}
            className="pointer-events-none"
          >
            <IslamicStickerGraphic
              type={stk.type}
              badgeText={stk.badge_text}
              badgeVariant={stk.badge_variant}
              colorOverride={stk.color_override}
            />
          </div>
        );
      })}
    </>
  );
}

function TextOverlayItem({ overlay, defaultZ, compact }: { overlay: PosterTextOverlay; defaultZ: number; compact?: boolean }) {
  if (overlay.is_hidden) return null;
  const { bgClass, isTransparent, customBgColor } = resolveOverlayBgClass(overlay);
  const topPct = overlay.pos_y !== undefined ? overlay.pos_y : overlay.position === 'top_banner' ? 10 : 85;
  const alignClass = overlay.text_align === 'left' ? 'text-left' : overlay.text_align === 'right' ? 'text-right' : 'text-center';

  if (compact) {
    const compactAlign = overlay.text_align === 'left' ? 'text-left pl-3 pr-8' : overlay.text_align === 'right' ? 'text-right pr-3 pl-8' : 'text-center px-6';
    return (
      <div
        style={{
          position: 'absolute',
          left: `${overlay.pos_x ?? 50}%`,
          top: `${overlay.pos_y ?? 50}%`,
          width: overlay.width_percent ? `${overlay.width_percent}%` : 'auto',
          transform: `translate(-50%, -50%) rotate(${overlay.rotation ?? 0}deg)`,
          zIndex: overlay.z_index ?? defaultZ,
          color: overlay.text_color || '#ffffff',
          backgroundColor: isTransparent ? 'transparent' : customBgColor || undefined,
        }}
        className={`inline-block py-2 rounded-lg shadow-xl ${bgClass} ${resolveFontClass(overlay.font_family)} ${resolveTextSizeClass(overlay.font_size)} ${overlay.is_bold ?? true ? 'font-bold' : 'font-normal'} ${overlay.is_italic ? 'italic' : ''} ${overlay.is_underline ? 'underline' : ''} ${compactAlign} pointer-events-none`}
      >
        {overlay.text}
      </div>
    );
  }

  const widthClass = overlay.width_mode === 'full' ? 'w-11/12 max-w-5xl' : overlay.width_mode === 'custom' && overlay.width_percent ? `w-[${overlay.width_percent}%]` : 'w-fit max-w-[95%]';
  return (
    <div
      style={{
        top: `${topPct}%`,
        left: `${overlay.pos_x ?? 50}%`,
        transform: `translate(-50%, -50%) rotate(${overlay.rotation || 0}deg)`,
        zIndex: overlay.z_index ?? defaultZ,
      }}
      className={`absolute pointer-events-none px-4 ${widthClass}`}
    >
      <div
        className={`inline-block w-full px-6 py-3 rounded-lg shadow-2xl transition-opacity ${bgClass} ${resolveFontClass(overlay.font_family)} ${resolveTextSizeClass(overlay.font_size)} ${overlay.is_bold ?? true ? 'font-bold' : 'font-normal'} ${overlay.is_italic ? 'italic' : ''} ${overlay.is_underline ? 'underline' : ''} ${alignClass}`}
        style={{ color: overlay.text_color || '#ffffff', backgroundColor: isTransparent ? 'transparent' : customBgColor || undefined }}
      >
        {overlay.text}
      </div>
    </div>
  );
}

function CompoundLayersView({
  layers,
  isDrawerOpen,
  globalMute,
  posterAllowAudio,
  slideIndex,
}: {
  layers?: readonly PosterCompoundLayer[] | undefined;
  isDrawerOpen: boolean;
  globalMute: boolean;
  posterAllowAudio: boolean;
  slideIndex?: number | undefined;
}) {
  return (
    <>
      {layers?.map((comp) => {
        if (comp.is_hidden) return null;
        return (
          <div
            key={comp.id}
            style={{
              position: 'absolute',
              left: `${comp.pos_x}%`,
              top: `${comp.pos_y}%`,
              width: `${comp.width_percent}%`,
              height: `${comp.height_percent}%`,
              transform: `translate(-50%, -50%) rotate(${comp.rotation ?? 0}deg) scale(${comp.flip_x ? -1 : 1}, ${comp.flip_y ? -1 : 1})`,
              zIndex: comp.z_index ?? 20,
            }}
            className="pointer-events-none"
          >
            {comp.merged_children.slots?.filter((s) => !s.is_hidden).map((slot) => (
              <div
                key={slot.id}
                style={{
                  position: 'absolute',
                  left: `${slot.pos_x ?? 50}%`,
                  top: `${slot.pos_y ?? 50}%`,
                  width: `${slot.width_percent ?? 50}%`,
                  height: `${slot.height_percent ?? 50}%`,
                  transform: `translate(-50%, -50%) rotate(${slot.rotation ?? 0}deg) scale(${slot.flip_x ? -1 : 1}, ${slot.flip_y ? -1 : 1})`,
                  zIndex: slot.z_index ?? 1,
                }}
                className="overflow-hidden shadow-2xl"
              >
                <SlotPresenter slot={slot} isDrawerOpen={isDrawerOpen} globalMute={globalMute} posterAllowAudio={posterAllowAudio} slideIndex={slideIndex} />
              </div>
            ))}
            <StickerListLayer stickers={comp.merged_children.stickers} defaultZ={25} />
            {comp.merged_children.text_overlays?.map((t) => (
              <TextOverlayItem key={t.id} overlay={t} defaultZ={30} compact />
            ))}
          </div>
        );
      })}
    </>
  );
}

export function CanvasOverlayLayers({
  layout,
  isDrawerOpen,
  globalMute,
  posterAllowAudio,
  defaultStickerZ,
  defaultTextZ,
  slideIndex,
}: {
  layout: PosterLayoutConfig;
  isDrawerOpen: boolean;
  globalMute: boolean;
  posterAllowAudio: boolean;
  defaultStickerZ: number;
  defaultTextZ: number;
  slideIndex?: number | undefined;
}) {
  return (
    <>
      <StickerListLayer stickers={layout.stickers} defaultZ={defaultStickerZ} />
      <CompoundLayersView
        layers={layout.compound_layers}
        isDrawerOpen={isDrawerOpen}
        globalMute={globalMute}
        posterAllowAudio={posterAllowAudio}
        slideIndex={slideIndex}
      />
      {layout.text_overlays?.map((overlay) => (
        <TextOverlayItem key={overlay.id} overlay={overlay} defaultZ={defaultTextZ} />
      ))}
    </>
  );
}
