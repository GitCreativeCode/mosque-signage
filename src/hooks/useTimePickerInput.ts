'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  formatTime24h,
  normalizeHourOnBlur,
  normalizeHourOnType,
  padTimePart,
  parse24hTime,
} from '@/lib/utils/time-picker-utils';

export function useTimePickerInput(value: string, onChange: (value24h: string) => void) {
  const initialParsed = parse24hTime(value);
  const [hourInput, setHourInput] = useState<string>(initialParsed.isValid ? padTimePart(initialParsed.h12) : '');
  const [minuteInput, setMinuteInput] = useState<string>(initialParsed.isValid ? padTimePart(initialParsed.min) : '');
  const [isPm, setIsPm] = useState<boolean>(initialParsed.isPm);
  const hourInputRef = useRef<HTMLInputElement>(null);
  const minuteInputRef = useRef<HTMLInputElement>(null);
  const isTypingHourRef = useRef(false);
  const isTypingMinuteRef = useRef(false);

  useEffect(() => {
    if (!value) {
      if (!isTypingHourRef.current && !isTypingMinuteRef.current) {
        setHourInput('');
        setMinuteInput('');
      }
      return;
    }
    const p = parse24hTime(value);
    if (!p.isValid) return;
    if (!isTypingHourRef.current) setHourInput(padTimePart(p.h12));
    if (!isTypingMinuteRef.current) setMinuteInput(padTimePart(p.min));
    setIsPm(p.isPm);
  }, [value]);

  const commitTime = useCallback(
    (h12: number, min: number, pm: boolean) => onChange(formatTime24h(h12, min, pm)),
    [onChange]
  );

  const handleHourBlur = () => {
    isTypingHourRef.current = false;
    const { hourNum, nextPm } = normalizeHourOnBlur(hourInput, isPm);
    if (nextPm !== isPm) setIsPm(nextPm);
    setHourInput(padTimePart(hourNum));
    commitTime(hourNum, Number(minuteInput) || 0, nextPm);
  };

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingHourRef.current = true;
    const res = normalizeHourOnType(e.target.value.replace(/\D/g, ''), isPm);
    setHourInput(res.display);
    if (res.nextPm !== isPm) setIsPm(res.nextPm);
    if (res.commitHour !== null) commitTime(res.commitHour, Number(minuteInput) || 0, res.nextPm);
  };

  const handleHourKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') { isTypingHourRef.current = true; setHourInput(''); return; }
    if (e.key === 'ArrowRight' || e.key === ':') {
      e.preventDefault();
      minuteInputRef.current?.focus();
      minuteInputRef.current?.select();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const cur = Number(hourInput) || 12;
    const next = e.key === 'ArrowUp' ? (cur >= 12 ? 1 : cur + 1) : (cur <= 1 ? 12 : cur - 1);
    setHourInput(padTimePart(next));
    commitTime(next, Number(minuteInput) || 0, isPm);
  };

  const handleMinuteBlur = () => {
    isTypingMinuteRef.current = false;
    const raw = Number(minuteInput);
    const m = Number.isNaN(raw) || raw < 0 ? 0 : Math.min(59, raw);
    setMinuteInput(padTimePart(m));
    commitTime(Number(hourInput) || 12, m, isPm);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingMinuteRef.current = true;
    const digits = e.target.value.replace(/\D/g, '');
    if (!digits) { setMinuteInput(''); return; }
    if (digits.length === 1) { setMinuteInput(digits); return; }
    const m = Math.min(59, Number(digits.slice(0, 2)));
    setMinuteInput(padTimePart(m));
    commitTime(Number(hourInput) || 12, m, isPm);
  };

  const handleMinuteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      isTypingMinuteRef.current = true;
      if (!minuteInput) { hourInputRef.current?.focus(); hourInputRef.current?.select(); }
      else setMinuteInput('');
      return;
    }
    if (e.key === 'ArrowLeft' && (e.currentTarget.selectionStart === 0 || !minuteInput)) {
      e.preventDefault();
      hourInputRef.current?.focus();
      hourInputRef.current?.select();
      return;
    }
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    e.preventDefault();
    const next = ((Number(minuteInput) || 0) + (e.key === 'ArrowUp' ? 1 : -1) + 60) % 60;
    setMinuteInput(padTimePart(next));
    commitTime(Number(hourInput) || 12, next, isPm);
  };

  return {
    hourInput, setHourInput, minuteInput, setMinuteInput, isPm, setIsPm,
    hourInputRef, minuteInputRef, isTypingHourRef, isTypingMinuteRef,
    commitTime, handleHourBlur, handleHourChange, handleHourKeyDown,
    handleMinuteBlur, handleMinuteChange, handleMinuteKeyDown,
  };
}

