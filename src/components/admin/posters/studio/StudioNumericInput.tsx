'use client';

import React, { useState, useEffect } from 'react';

interface StudioNumericInputProps {
  readonly value: number;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly onChange: (val: number) => void;
  readonly className?: string | undefined;
  readonly title?: string | undefined;
}

/** Numeric input permitting intermediate minus/empty states without premature clamp resets. */
export function StudioNumericInput({
  value,
  min,
  max,
  onChange,
  className,
  title,
}: StudioNumericInputProps) {
  const [draft, setDraft] = useState<string>(String(value));
  const [isFocused, setIsFocused] = useState<boolean>(false);

  useEffect(() => {
    if (!isFocused) {
      setDraft(String(value));
    }
  }, [value, isFocused]);

  const commit = () => {
    let parsed = parseInt(draft, 10);
    if (isNaN(parsed)) parsed = 0;
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;
    setDraft(String(parsed));
    if (parsed !== value) {
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="numeric"
      value={isFocused ? draft : String(value)}
      title={title}
      onFocus={() => {
        setIsFocused(true);
        setDraft(String(value));
      }}
      onChange={(e) => {
        const val = e.target.value;
        if (val === '' || val === '-' || /^-?\d*$/.test(val)) {
          setDraft(val);
        }
      }}
      onBlur={() => {
        commit();
        setIsFocused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          commit();
          (e.target as HTMLInputElement).blur();
        }
      }}
      className={className}
    />
  );
}

