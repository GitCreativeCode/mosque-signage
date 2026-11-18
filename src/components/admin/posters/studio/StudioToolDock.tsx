'use client';

import React from 'react';
import type { StudioTab } from '@/lib/posters/studio-types';
import { Columns, Layers, Square, Star, Type, QrCode, Sliders, HelpCircle } from 'lucide-react';

interface StudioToolDockProps {
  readonly activeTab: StudioTab;
  readonly onSelectTab: (tab: StudioTab) => void;
  readonly onShowShortcuts: () => void;
}

const TOOL_TABS: ReadonlyArray<{
  readonly id: StudioTab;
  readonly label: string;
  readonly title: string;
  readonly Icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'layout', label: 'Layout', title: 'Layout Archetypes & Spacing', Icon: Columns },
  { id: 'layers', label: 'Layers', title: 'Layers & Slot Content', Icon: Layers },
  { id: 'frames', label: 'Frames', title: 'Frames & Border Styles', Icon: Square },
  { id: 'stickers', label: 'Stickers', title: 'Islamic Stickers & Badges', Icon: Star },
  { id: 'text', label: 'Text', title: 'Text Overlays & Rectangular Banners', Icon: Type },
  { id: 'qr', label: 'QR', title: 'Call-to-Action QR Code', Icon: QrCode },
  { id: 'settings', label: 'Config', title: 'Timing & Slide Settings', Icon: Sliders },
];

/** Slim 64px vertical icon tool rail for switching Studio editing tabs. */
export function StudioToolDock({
  activeTab,
  onSelectTab,
  onShowShortcuts,
}: StudioToolDockProps) {
  return (
    <div className="w-16 border-r border-[var(--admin-border)] bg-[var(--admin-surface)] flex flex-col items-center py-4 space-y-3 shrink-0 select-none overscroll-contain">
      {TOOL_TABS.map(({ id, label, title, Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelectTab(id)}
            className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-[10px] font-semibold transition-all cursor-pointer ${
              isActive
                ? 'border border-[var(--admin-tab-active-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm'
                : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)]'
            }`}
            title={title}
          >
            <Icon className="w-5 h-5 mb-0.5 opacity-80" />
            <span>{label}</span>
          </button>
        );
      })}

      <div className="mt-auto pt-3 border-t border-[var(--admin-border)] flex flex-col items-center">
        <div className="group relative">
          <button
            type="button"
            onClick={onShowShortcuts}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-card)] transition-colors cursor-pointer"
            aria-label="Studio Keyboard Shortcuts and Help"
          >
            <HelpCircle className="w-5 h-5 opacity-80" />
          </button>
          <div className="absolute left-full ml-2 bottom-1 hidden group-hover:block z-50 whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-black/90 text-white text-[11px] shadow-lg pointer-events-none">
            Shortcuts: 1-9 Select layer • Del Remove • Ctrl+Z Undo
          </div>
        </div>
      </div>
    </div>
  );
}

