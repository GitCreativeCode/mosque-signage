'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { CALCULATION_METHODS } from '@/lib/prayer/calculation-methods';

export { CALCULATION_METHODS };

export interface AstronomicalCalculationSectionProps {
  readonly calculationMethod: string;
  readonly setCalculationMethod: (val: string) => void;
  readonly madhab: 'shafi' | 'hanafi';
  readonly setMadhab: (val: 'shafi' | 'hanafi') => void;
  readonly latitude: number | null;
  readonly setLatitude: (val: number | null) => void;
  readonly longitude: number | null;
  readonly setLongitude: (val: number | null) => void;
}

export function AstronomicalCalculationSection({
  calculationMethod,
  setCalculationMethod,
  madhab,
  setMadhab,
  latitude,
  setLongitude,
  longitude,
  setLatitude,
}: AstronomicalCalculationSectionProps) {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectSuccess, setDetectSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsDetecting(true);
    setLocationError(null);
    setDetectSuccess(false);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(parseFloat(position.coords.latitude.toFixed(5)));
        setLongitude(parseFloat(position.coords.longitude.toFixed(5)));
        setIsDetecting(false);
        setDetectSuccess(true);
        setTimeout(() => setDetectSuccess(false), 3000);
      },
      (err) => {
        setLocationError(`Location detection failed: ${err.message}`);
        setIsDetecting(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bg-[#20222a] border border-[#2e323b] rounded-xl p-6 shadow-sm space-y-5">
      <div className="pb-3 border-b border-[#2e323b]">
        <h3 className="text-sm font-semibold text-white tracking-tight">
          Prayer Calculation Method &amp; School of Thought
        </h3>
        <p className="text-xs text-neutral-400 mt-0.5">
          Select the calculation convention and location coordinates used to determine prayer times.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Calculation Method
          </label>
          <select
            value={calculationMethod}
            onChange={(e) => setCalculationMethod(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white text-xs focus:outline-none focus:border-[#388bfd]"
          >
            {CALCULATION_METHODS.map((m) => (
              <option key={m.id} value={m.id} className="bg-[#20222a] text-white">
                {m.label}
              </option>
            ))}
          </select>
          <p className="text-[11px] text-neutral-400 mt-1.5">
            {CALCULATION_METHODS.find((m) => m.id === calculationMethod)?.description ??
              'Selected prayer calculation convention.'}
          </p>
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-300 mb-1.5">
            Asr Method (Madhab)
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMadhab('shafi')}
              className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer active:scale-95 ${
                madhab === 'shafi'
                  ? 'bg-[#282a35] border-[#388bfd] text-white shadow-sm'
                  : 'bg-[#15161b] border-[#313542] text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-semibold text-xs">Standard / Shafi&apos;i</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Shadow factor 1× (Shafi&apos;i, Maliki, Hanbali)
              </div>
            </button>

            <button
              type="button"
              onClick={() => setMadhab('hanafi')}
              className={`p-3 rounded-lg border text-left transition-all duration-150 cursor-pointer active:scale-95 ${
                madhab === 'hanafi'
                  ? 'bg-[#282a35] border-[#388bfd] text-white shadow-sm'
                  : 'bg-[#15161b] border-[#313542] text-neutral-400 hover:text-white'
              }`}
            >
              <div className="font-semibold text-xs">Hanafi</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">
                Shadow factor 2× (Later Asr Adhan)
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-[#2e323b] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-xs font-medium text-neutral-300">
            Coordinates (Latitude &amp; Longitude)
          </label>

          <button
            type="button"
            onClick={handleDetectLocation}
            disabled={isDetecting}
            className="px-3 py-1.5 rounded-lg bg-[#282a35] hover:bg-[#323642] active:scale-95 cursor-pointer disabled:opacity-50 text-neutral-200 hover:text-white text-xs font-medium border border-[#353945] flex items-center space-x-1.5 transition-all duration-150 self-start sm:self-auto"
          >
            {isDetecting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>
              {isDetecting
                ? 'Detecting Location...'
                : detectSuccess
                ? 'Location Found!'
                : 'Auto-Detect Location'}
            </span>
          </button>
        </div>

        {locationError && (
          <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {locationError}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Latitude</span>
            <input
              type="number"
              step="any"
              value={latitude ?? ''}
              onChange={(e) => {
                const v = e.target.value.trim();
                setLatitude(v === '' ? null : parseFloat(v));
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono text-xs focus:outline-none focus:border-[#388bfd] tabular-nums"
              placeholder="e.g. 43.5890"
            />
          </div>

          <div>
            <span className="block text-[11px] text-neutral-400 mb-1">Longitude</span>
            <input
              type="number"
              step="any"
              value={longitude ?? ''}
              onChange={(e) => {
                const v = e.target.value.trim();
                setLongitude(v === '' ? null : parseFloat(v));
              }}
              className="w-full px-3 py-2 rounded-lg bg-[#15161b] border border-[#313542] text-white font-mono text-xs focus:outline-none focus:border-[#388bfd] tabular-nums"
              placeholder="e.g. -79.6441"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
