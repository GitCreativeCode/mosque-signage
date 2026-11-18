'use client';

import React from 'react';
import type { NoticeTheme, TextOverlayFont } from '@/types/index';
import { getLiturgicalTheme } from '@/lib/posters/notice-themes';
import { resolveFontClass } from './overlay-styles';

export interface NoticeSlotViewProps {
  readonly headline: string;
  readonly description: string;
  readonly theme: NoticeTheme;
  readonly font?: TextOverlayFont | undefined;
  readonly align?: 'left' | 'center' | 'right' | undefined;
}

export function NoticeSlotView({ headline, description, theme, font, align }: NoticeSlotViewProps) {
  const palette = getLiturgicalTheme(theme);
  const fontClass = resolveFontClass(font);
  const alignClass =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center';

  return (
    <div
      className={`relative w-full h-full p-6 md:p-8 flex flex-col justify-center ${alignClass} ${fontClass} overflow-hidden`}
      style={{
        background: `linear-gradient(to bottom, ${palette.gradStart}, ${palette.gradMid}, ${palette.gradEnd})`,
      }}
    >
      <h2
        className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md max-w-3xl"
        style={{ color: palette.headlineColor }}
      >
        {headline}
      </h2>
      <div
        className="w-20 md:w-28 h-1.5 rounded-full my-3 md:my-4 shadow-sm"
        style={{ backgroundColor: palette.borderAccent }}
      />
      {description && (
        <p
          className="text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl drop-shadow-sm"
          style={{ color: palette.textColor }}
        >
          {description}
        </p>
      )}
    </div>
  );
}

