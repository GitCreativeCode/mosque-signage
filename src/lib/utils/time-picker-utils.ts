export interface ParsedTime24 {
  readonly h12: number;
  readonly min: number;
  readonly isPm: boolean;
  readonly isValid: boolean;
}

export interface ClockDialPosition {
  readonly val: number;
  readonly x: number;
  readonly y: number;
  readonly label?: string;
}

export const CLOCK_HOUR_POSITIONS: readonly ClockDialPosition[] = [
  { val: 12, x: 96, y: 24 },
  { val: 1, x: 132, y: 34 },
  { val: 2, x: 158, y: 60 },
  { val: 3, x: 168, y: 96 },
  { val: 4, x: 158, y: 132 },
  { val: 5, x: 132, y: 158 },
  { val: 6, x: 96, y: 168 },
  { val: 7, x: 60, y: 158 },
  { val: 8, x: 34, y: 132 },
  { val: 9, x: 24, y: 96 },
  { val: 10, x: 34, y: 60 },
  { val: 11, x: 60, y: 34 },
];

export const CLOCK_MINUTE_POSITIONS: readonly ClockDialPosition[] = [
  { val: 0, label: '00', x: 96, y: 24 },
  { val: 5, label: '05', x: 132, y: 34 },
  { val: 10, label: '10', x: 158, y: 60 },
  { val: 15, label: '15', x: 168, y: 96 },
  { val: 20, label: '20', x: 158, y: 132 },
  { val: 25, label: '25', x: 132, y: 158 },
  { val: 30, label: '30', x: 96, y: 168 },
  { val: 35, label: '35', x: 60, y: 158 },
  { val: 40, label: '40', x: 34, y: 132 },
  { val: 45, label: '45', x: 24, y: 96 },
  { val: 50, label: '50', x: 34, y: 60 },
  { val: 55, label: '55', x: 60, y: 34 },
];

export function padTimePart(n: number): string {
  return String(n).padStart(2, '0');
}

export function parse24hTime(val: string): ParsedTime24 {
  if (!val || !val.includes(':')) {
    return { h12: 12, min: 0, isPm: false, isValid: false };
  }
  const [hStr, mStr] = val.split(':');
  const h24 = Number(hStr);
  const min = Number(mStr);
  if (Number.isNaN(h24) || Number.isNaN(min)) {
    return { h12: 12, min: 0, isPm: false, isValid: false };
  }
  const isPm = h24 >= 12;
  let h12 = h24 % 12;
  if (h12 === 0) h12 = 12;
  return { h12, min, isPm, isValid: true };
}

export function formatTime24h(h12: number, min: number, pm: boolean): string {
  let h24 = h12 % 12;
  if (pm) h24 += 12;
  return `${padTimePart(h24)}:${padTimePart(min)}`;
}

export function normalizeHourOnBlur(
  hourInput: string,
  currentPm: boolean
): { hourNum: number; nextPm: boolean } {
  let num = Number(hourInput);
  if (!num || num < 1) return { hourNum: 12, nextPm: currentPm };
  if (num === 24 || num === 0) return { hourNum: 12, nextPm: false };
  if (num >= 13 && num <= 23) return { hourNum: num - 12, nextPm: true };
  if (num > 24) num = Number(String(num).slice(-1)) || 12;
  return { hourNum: num, nextPm: currentPm };
}

export function normalizeHourOnType(
  digits: string,
  currentPm: boolean
): { display: string; commitHour: number | null; nextPm: boolean } {
  if (!digits) return { display: '', commitHour: null, nextPm: currentPm };
  if (digits.length === 1) return { display: digits, commitHour: null, nextPm: currentPm };

  const num = Number(digits.slice(0, 2));
  if (num === 24 || num === 0) return { display: '12', commitHour: 12, nextPm: false };
  if (num >= 13 && num <= 23) {
    const h12 = num - 12;
    return { display: padTimePart(h12), commitHour: h12, nextPm: true };
  }
  if (num >= 1 && num <= 12) {
    return { display: padTimePart(num), commitHour: num, nextPm: currentPm };
  }
  const lastDigit = Number(digits.slice(-1)) || 12;
  return { display: padTimePart(lastDigit), commitHour: lastDigit, nextPm: currentPm };
}

export function calculateMinuteFromDialPointer(
  clientX: number,
  clientY: number,
  rect: DOMRect
): number {
  const dx = clientX - (rect.left + rect.width / 2);
  const dy = clientY - (rect.top + rect.height / 2);
  let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (deg < 0) deg += 360;
  return Math.round(deg / 6) % 60;
}

