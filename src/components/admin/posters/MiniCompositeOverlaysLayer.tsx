'use client';

import React from 'react';
import type { PosterLayoutConfig, PosterTextOverlay } from '@/types/index';
import { IslamicStickerGraphic } from '@/components/common/IslamicStickerGraphic';
import { SteppedTextLines } from '@/components/common/SteppedTextLines';
import {
  clampTextScale,
  resolveOverlayBgClass,
  resolveTextFontSizeCss,
} from '@/lib/posters/overlay-styles';
import { MiniCompositeSlotContent } from './MiniCompositeSlotContent';

function MiniOverlayPill({ ov }: { readonly ov: PosterTextOverlay }) {
  const { isTransparent, customBgColor, bgClass } = resolveOverlayBgClass(ov);
  const topPct = ov.pos_y !== undefined ? ov.pos_y : ov.position === 'top_banner' ? 12 : 85;
  const leftPct = ov.pos_x !== undefined ? ov.pos_x : 50;
  const isHugLines = ov.box_fit === 'hug_lines';
  const effectiveBg = isTransparent ? 'transparent' : customBgColor || undefined;
  const scaleX = clampTextScale(ov.scale_x);
  const scaleY = clampTextScale(ov.scale_y);
  const fontSizeCss = resolveTextFontSizeCss(ov.font_size);

  return (
    <div
      style={{
        position: 'absolute',
        top: `${topPct}%`,
        left: `${leftPct}%`,
        transform: `translate(-50%, -50%) rotate(${ov.rotation || 0}deg) scale(${scaleX}, ${scaleY})`,
        color: ov.text_color || '#ffffff',
        opacity: (ov.bg_opacity ?? 100) / 100,
        zIndex: ov.z_index ?? 30,
        fontSize: fontSizeCss,
        lineHeight: 1.15,
      }}
      className="pointer-events-none max-w-[95%]"
    >
      {isHugLines ? (
        <SteppedTextLines
          text={ov.text}
          align={ov.text_align}
          backgroundColor={effectiveBg}
          containerClassName="-space-y-0.5"
          lineClassName={`inline-block font-inherit whitespace-pre-wrap leading-[1.15] rounded-none ${
            ov.is_bold ?? true ? 'font-bold' : 'font-normal'
          } ${ov.is_italic ? 'italic' : ''} ${ov.is_underline ? 'underline' : ''}`}
          lineStyle={{ padding: '0.14em 0.45em' }}
        />
      ) : (
        <div
          style={{ backgroundColor: effectiveBg, padding: '0.22em 0.6em' }}
          className={`whitespace-pre-wrap text-center leading-[1.15] ${
            ov.is_bold ?? true ? 'font-bold' : 'font-normal'
          } ${ov.is_italic ? 'italic' : ''} ${ov.is_underline ? 'underline' : ''} ${bgClass}`}
        >
          {ov.text}
        </div>
      )}
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
              <MiniOverlayPill key={ov.id} ov={ov} />
            ))}
          </div>
        );
      })}

      {layout.text_overlays?.map((ov) =>
        ov.is_hidden ? null : <MiniOverlayPill key={ov.id} ov={ov} />
      )}
    </>
  );
}

