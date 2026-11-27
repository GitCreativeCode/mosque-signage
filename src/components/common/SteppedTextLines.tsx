'use client';

import React from 'react';

export interface SteppedTextLinesProps {
  readonly text: string;
  readonly align?: 'left' | 'center' | 'right' | undefined;
  readonly backgroundColor?: string | undefined;
  readonly containerClassName?: string | undefined;
  readonly lineClassName?: string | undefined;
  readonly lineStyle?: React.CSSProperties | undefined;
}

/**
 * Renders multi-line text with individual stepped highlight pill badges per line.
 * Used across display kiosk layers, admin layout studio, and thumbnail generators.
 */
export function SteppedTextLines({
  text,
  align = 'center',
  backgroundColor,
  containerClassName = '-space-y-0.5',
  lineClassName = 'inline-block px-3.5 py-1.5 font-inherit leading-normal whitespace-pre-wrap rounded-none shadow-xs',
  lineStyle,
}: SteppedTextLinesProps) {
  const lines = (text || '').split('\n');
  const alignClass = align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center';

  return (
    <div className={`flex flex-col ${alignClass} ${containerClassName}`}>
      {lines.map((line, idx) => (
        <span
          key={idx}
          style={{ ...lineStyle, backgroundColor }}
          className={lineClassName}
        >
          {line || '\u00A0'}
        </span>
      ))}
    </div>
  );
}

