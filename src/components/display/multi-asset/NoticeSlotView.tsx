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
  readonly headlineAlign?: 'left' | 'center' | 'right' | undefined;
  readonly headlineItalic?: boolean | undefined;
  readonly headlineUnderline?: boolean | undefined;
}

export function NoticeSlotView({
  headline,
  description,
  theme,
  font,
  align = 'center',
  headlineAlign = 'center',
  headlineItalic = false,
  headlineUnderline = false,
}: NoticeSlotViewProps) {
  const palette = getLiturgicalTheme(theme);
  const fontClass = resolveFontClass(font);
  const hAlignClass = headlineAlign === 'left' ? 'text-left self-start' : headlineAlign === 'right' ? 'text-right self-end' : 'text-center self-center';
  const dAlignClass = align === 'left' ? 'text-left self-start' : align === 'right' ? 'text-right self-end' : 'text-center self-center';
  const dividerAlign = headlineAlign === 'left' ? 'self-start' : headlineAlign === 'right' ? 'self-end' : 'self-center';

  return (
    <div
      className={`relative w-full h-full p-6 md:p-8 flex flex-col justify-center items-stretch ${fontClass} overflow-hidden`}
      style={{
        background: `linear-gradient(to bottom, ${palette.gradStart}, ${palette.gradMid}, ${palette.gradEnd})`,
      }}
    >
      <h2
        className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight drop-shadow-md max-w-3xl ${hAlignClass} ${
          headlineItalic ? 'italic' : ''
        } ${headlineUnderline ? 'underline' : ''}`}
        style={{ color: palette.headlineColor }}
      >
        {headline}
      </h2>
      <div
        className={`w-20 md:w-28 h-1.5 rounded-full my-3 md:my-4 shadow-sm ${dividerAlign}`}
        style={{ backgroundColor: palette.borderAccent }}
      />
      {description && (
        <p
          className={`text-base sm:text-lg md:text-xl lg:text-2xl font-medium leading-relaxed max-w-2xl drop-shadow-sm ${dAlignClass}`}
          style={{ color: palette.textColor }}
        >
          {description}
        </p>
      )}
    </div>
  );
}
