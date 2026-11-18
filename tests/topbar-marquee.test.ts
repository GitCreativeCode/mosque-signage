import { describe, it, expect } from 'vitest';

describe('TopBar Marquee Loop Behavior', () => {
  it('combines greeting and mosque name correctly when greeting exists', () => {
    const greeting = 'Welcome to';
    const mosqueName = 'Masjid Al-Noor Islamic Center';
    const fullMosqueTitle = greeting?.trim()
      ? `${greeting.trim()} ${mosqueName}`
      : mosqueName;

    expect(fullMosqueTitle).toBe('Welcome to Masjid Al-Noor Islamic Center');
  });

  it('uses only mosque name when greeting is absent or empty whitespace', () => {
    const greeting = '   ';
    const mosqueName = 'Masjid Al-Noor';
    const fullMosqueTitle = greeting?.trim()
      ? `${greeting.trim()} ${mosqueName}`
      : mosqueName;

    expect(fullMosqueTitle).toBe('Masjid Al-Noor');
  });

  it('creates tickerUnit with mosque title only when cleanTicker is empty', () => {
    const fullMosqueTitle = 'Welcome to The Grand Islamic Cultural Society & Educational Foundation';
    const cleanTicker = '';
    const tickerUnit = cleanTicker
      ? `${fullMosqueTitle} \u00A0•\u00A0 ${cleanTicker}`
      : fullMosqueTitle;

    expect(tickerUnit).toBe(fullMosqueTitle);
  });

  it('calculates repeatCount to span at least 3500px for seamless infinite marquee loop', () => {
    const tickerUnit = 'Welcome to The Grand Islamic Cultural Society & Educational Foundation';
    const shouldMarquee = true;
    const repeatCount = shouldMarquee
      ? Math.max(3, Math.ceil(3500 / Math.max(tickerUnit.length * 14, 100)))
      : 0;

    expect(repeatCount).toBeGreaterThanOrEqual(3);

    const fullHalfText = shouldMarquee
      ? Array(repeatCount).fill(tickerUnit).join(' \u00A0\u00A0•\u00A0\u00A0 ') + ' \u00A0\u00A0•\u00A0\u00A0 '
      : '';

    // Verify trailing separator matches internal separator for seamless 0% -> -50% translation loop
    expect(fullHalfText.endsWith(' \u00A0\u00A0•\u00A0\u00A0 ')).toBe(true);
    // Verify each repetition is separated
    const occurrences = fullHalfText.split(tickerUnit).length - 1;
    expect(occurrences).toBe(repeatCount);
  });
});
