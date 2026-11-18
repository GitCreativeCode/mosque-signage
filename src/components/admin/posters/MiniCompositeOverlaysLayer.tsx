'use client';

import React from 'react';
import type { PosterLayoutConfig, PosterTextOverlay } from '@/types/index';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { MiniCompositeSlotContent } from './MiniCompositeSlotContent';

function resolveOverlayBgClasses(ov: PosterTextOverlay): {
  isTransparent: boolean;
  customBg: string | undefined;
  styleClass: string;
} {
  const isTransparent = ov.bg_color === 'transparent' || ov.bg_style === 'transparent';
  const customBg = isTransparent ? 'transparent' : ov.bg_color;
  const styleClass = isTransparent
    ? 'bg-transparent border-0'
    : customBg
    ? 'border border-white/20'
    : ov.bg_style === 'glass'
    ? 'bg-slate-900/80 border border-white/20'
    : ov.bg_style === 'emerald'
    ? 'bg-emerald-950/90 border border-emerald-400/50'
    : ov.bg_style === 'gold'
    ? 'bg-black/90 border border-amber-400/60'
    : 'bg-black/85 border border-white/20';
  return { isTransparent, customBg, styleClass };
}

function MiniOverlayPill({ ov, textClass }: { readonly ov: PosterTextOverlay; readonly textClass: string }) {
  const { isTransparent, customBg, styleClass } = resolveOverlayBgClasses(ov);
  const topPct = ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85;
  const leftPct = ov.pos_x !== undefined ? ov.pos_x : 50;

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: `${leftPct}%`,
        transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg)`,
        color: ov.text_color || '#ffffff',
        zIndex: ov.z_index ?? 30,
      }}
      className="pointer-events-none max-w-[90%]"
    >
      <div
        style={{ backgroundColor: isTransparent ? 'transparent' : customBg || undefined }}
        className={`rounded truncate text-center leading-tight ${textClass} ${ov.is_bold ?? true ? 'font-bold' : 'font-normal'} ${
          ov.is_italic ? 'italic' : ''
        } ${ov.is_underline ? 'underline' : ''} ${styleClass}`}
      >
        {ov.text}
      </div>
    </div>
  );
}

export function MiniCompositeOverlaysLayer({
  layout,
  stickerDefaultZ,
}: {
  readonly layout: PosterLayoutConfig;
  readonly stickerDefaultZ: number;
}) {
  return (
    <>
      {layout.stickers?.map((stk) => {
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
              zIndex: stk.z_index ?? stickerDefaultZ,
            }}
            className="pointer-events-none"
          >
            <IslamicStickerGraphic type={stk.type} badgeText={stk.badge_text} badgeVariant={stk.badge_variant} colorOverride={stk.color_override} />
          </div>
        );
      })}

      {layout.compound_layers?.map((comp) => {
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
            {comp.merged_children.slots?.filter((s) => !s.is_hidden).map((s) => (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  left: `${s.pos_x ?? 50}%`,
                  top: `${s.pos_y ?? 50}%`,
                  width: `${s.width_percent ?? 50}%`,
                  height: `${s.height_percent ?? 50}%`,
                  transform: `translate(-50%, -50%) rotate(${s.rotation ?? 0}deg) scale(${s.flip_x ? -1 : 1}, ${s.flip_y ? -1 : 1})`,
                }}
                className="overflow-hidden"
              >
                <MiniCompositeSlotContent slot={s} />
              </div>
            ))}
            {comp.merged_children.stickers?.filter((stk) => !stk.is_hidden).map((stk) => (
              <div
                key={stk.id}
                style={{
                  position: 'absolute',
                  left: `${stk.pos_x}%`,
                  top: `${stk.pos_y}%`,
                  width: `${stk.width_percent}%`,
                  height: `${stk.height_percent}%`,
                  transform: `translate(-50%, -50%) rotate(${stk.rotation ?? 0}deg) scale(${stk.flip_x ? -1 : 1}, ${stk.flip_y ? -1 : 1})`,
                }}
                className="pointer-events-none"
              >
                <IslamicStickerGraphic type={stk.type} badgeText={stk.badge_text} badgeVariant={stk.badge_variant} colorOverride={stk.color_override} />
              </div>
            ))}
            {comp.merged_children.text_overlays?.filter((ov) => !ov.is_hidden).map((ov) => (
              <MiniOverlayPill key={ov.id} ov={ov} textClass="px-1 py-0.5 shadow-sm text-[6px]" />
            ))}
          </div>
        );
      })}

      {layout.text_overlays?.map((ov) =>
        ov.is_hidden ? null : <MiniOverlayPill key={ov.id} ov={ov} textClass="px-1.5 py-0.5 shadow-md text-[7px]" />
      )}
    </>
  );
}

