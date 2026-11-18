export type DatePresetKey = 'today' | 'tomorrow' | 'friday' | 'week1' | 'week2';

export function padDatePart(n: number): string {
  return String(n).padStart(2, '0');
}

export function parseDateInput(input: string): { year: number; month: number; day: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (isoMatch?.[1] && isoMatch[2] && isoMatch[3]) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { year, month, day };
  }

  const usMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (usMatch?.[1] && usMatch[2] && usMatch[3]) {
    const month = Number(usMatch[1]);
    const day = Number(usMatch[2]);
    const year = Number(usMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) return { year, month, day };
  }

  return null;
}

export function parseTimeInput(input: string): { hour: number; minute: number } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (ampmMatch?.[1] && ampmMatch[2] && ampmMatch[3]) {
    let hour = Number(ampmMatch[1]);
    const minute = Number(ampmMatch[2]);
    const isPm = ampmMatch[3].toLowerCase() === 'pm';
    if (hour < 1 || hour > 12 || minute < 0 || minute > 59) return null;
    if (isPm && hour < 12) hour += 12;
    if (!isPm && hour === 12) hour = 0;
    return { hour, minute };
  }

  const h24Match = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (h24Match?.[1] && h24Match[2]) {
    const hour = Number(h24Match[1]);
    const minute = Number(h24Match[2]);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) return { hour, minute };
  }

  return null;
}

export function resolveDatePresetTarget(preset: DatePresetKey, now: Date): {
  dateText: string;
  viewMonthDate: Date;
} {
  let target = new Date(now);
  if (preset === 'tomorrow') {
    target = new Date(now.getTime() + 86400000);
  } else if (preset === 'friday') {
    const diff = (5 - now.getDay() + 7) % 7 || 7;
    target = new Date(now.getTime() + diff * 86400000);
  } else if (preset === 'week1') {
    target = new Date(now.getTime() + 7 * 86400000);
  } else if (preset === 'week2') {
    target = new Date(now.getTime() + 14 * 86400000);
  }

  const y = target.getFullYear();
  const m = padDatePart(target.getMonth() + 1);
  const d = padDatePart(target.getDate());
  return {
    dateText: `${y}-${m}-${d}`,
    viewMonthDate: new Date(y, target.getMonth(), 1),
  };
}

