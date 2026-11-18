'use client';

import React from 'react';
import { Repeat, Volume2, VolumeX } from 'lucide-react';
import { calculateTotalDwell } from '@/lib/engine/video-engine';

export interface PosterVideoEngineSectionProps {
  readonly videoDuration: number;
  readonly videoLoopCount: number;
  readonly maxLoops: number;
  readonly activeTotalDwell: number;
  readonly allowAudio: boolean;
  readonly onLoopCountChange: (count: number) => void;
  readonly onChangeAllowAudio: (allow: boolean) => void;
}

export function PosterVideoEngineSection({
  videoDuration,
  videoLoopCount,
  maxLoops,
  activeTotalDwell,
  allowAudio,
  onLoopCountChange,
  onChangeAllowAudio,
}: PosterVideoEngineSectionProps) {
  return (
    <div className="p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Repeat className="w-4 h-4 text-[var(--admin-accent)]" />
          <span className="text-xs font-semibold text-[var(--admin-text-primary)]">Intelligent Looping Engine</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-[var(--admin-card)] border border-[var(--admin-border)] font-mono text-xs font-bold text-[var(--admin-text-primary)] tabular-nums">
          Total: {activeTotalDwell}s
        </span>
      </div>

      {videoDuration <= 30 ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-[var(--admin-text-secondary)]">
            <span>Clip Duration: <strong className="text-[var(--admin-text-primary)]">{videoDuration}s</strong></span>
            <span>Repeat Count: <strong className="text-[var(--admin-text-primary)]">{videoLoopCount}x</strong></span>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={videoLoopCount}
              onChange={(e) => onLoopCountChange(parseInt(e.target.value, 10))}
              className="px-3 py-2 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)] text-[var(--admin-text-primary)] text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--admin-tab-active-border)] cursor-pointer"
            >
              {Array.from({ length: maxLoops }, (_, i) => i + 1).map((cnt) => (
                <option key={cnt} value={cnt}>
                  Loop {cnt} time{cnt > 1 ? 's' : ''} ({calculateTotalDwell(videoDuration, cnt)}s total)
                </option>
              ))}
            </select>
            <span className="text-[11px] text-[var(--admin-text-muted)]">
              Repeats {videoLoopCount} times • Total on-screen: {activeTotalDwell}s (Max: 60s)
            </span>
          </div>
        </div>
      ) : (
        <div className="p-2.5 rounded-lg bg-[var(--admin-card)] border border-[var(--admin-border)] text-xs text-[var(--admin-text-secondary)]">
          Clip Duration: <strong className="text-[var(--admin-text-primary)]">{videoDuration}s</strong> • Single playthrough (Cannot loop as 2x would exceed 60s).
        </div>
      )}

      <div className="pt-2 border-t border-[var(--admin-border)] flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {allowAudio ? <Volume2 className="w-4 h-4 text-[var(--admin-success)]" /> : <VolumeX className="w-4 h-4 text-[var(--admin-text-muted)]" />}
          <div>
            <span className="text-xs font-medium text-[var(--admin-text-primary)] block">Allow Audio During Broadcast</span>
            <span className="text-[10px] text-[var(--admin-text-muted)]">
              Default muted for prayer hall reverence. Automatically ducks/mutes during prayer modes.
            </span>
          </div>
        </div>
        <input type="checkbox" checked={allowAudio} onChange={(e) => onChangeAllowAudio(e.target.checked)} className="w-4 h-4 accent-[var(--admin-tab-active-border)] rounded cursor-pointer" />
      </div>
    </div>
  );
}

