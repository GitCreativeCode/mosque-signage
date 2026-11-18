'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { SlotFrameStyle } from '@/types/index';
import { FRAME_STYLES_REGISTRY } from '@/lib/posters/layout-engine';
import {
  Square,
  Star,
  Shield,
  Layers,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { CustomFrameLibraryGrid } from './CustomFrameLibraryGrid';
import type { CustomFrameItem } from '@/lib/posters/custom-frames-store';

export interface FrameStylePickerProps {
  readonly selected: SlotFrameStyle;
  readonly selectedCustomUrl?: string | undefined;
  readonly onChange: (style: SlotFrameStyle, customUrl?: string) => void;
  readonly disabled?: boolean;
}

const PRESET_ICONS: Record<Exclude<SlotFrameStyle, 'custom'>, React.ComponentType<{ className?: string }>> = {
  none: Square,
  clean_border: Square,
  islamic_matting: Shield,
  gold_emerald_trim: Star,
  card_shadow: Layers,
  polaroid: ImageIcon,
};

export function FrameStylePicker({
  selected,
  selectedCustomUrl,
  onChange,
  disabled = false,
}: FrameStylePickerProps) {
  const [customFrames, setCustomFrames] = useState<CustomFrameItem[]>([]);
  const [isLoadingFrames, setIsLoadingFrames] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load custom frames from server
  const loadFrames = async () => {
    setIsLoadingFrames(true);
    try {
      const { getCustomFrames } = await import('@/lib/actions/custom-frames');
      const list = await getCustomFrames();
      setCustomFrames(list);
    } catch (err) {
      console.warn('Failed loading custom frames:', err);
    } finally {
      setIsLoadingFrames(false);
    }
  };

  useEffect(() => {
    loadFrames();
  }, []);

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const buffer = await file.arrayBuffer();
      const { uploadCustomFrame } = await import('@/lib/actions/custom-frames');
      const newFrame = await uploadCustomFrame({
        fileBuffer: buffer,
        fileName: file.name,
        mimeType: file.type || 'image/png',
        name: file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
      });
      await loadFrames();
      onChange('custom', newFrame.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteFrame = async (e: React.MouseEvent, frameId: string) => {
    e.stopPropagation();
    try {
      const { deleteCustomFrame } = await import('@/lib/actions/custom-frames');
      await deleteCustomFrame(frameId);
      await loadFrames();
      if (selected === 'custom') {
        onChange('none');
      }
    } catch (err) {
      console.error('Failed to delete custom frame:', err);
    }
  };

  const presetList = Object.values(FRAME_STYLES_REGISTRY).filter((m) => m.id !== 'custom') as Array<
    (typeof FRAME_STYLES_REGISTRY)[Exclude<SlotFrameStyle, 'custom'>]
  >;

  return (
    <div className="space-y-4">
      {/* Preset Mosque & Modern Styles */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Preset Mosque & Modern Frames
        </label>
        <div className="grid grid-cols-2 gap-2">
          {presetList.map((meta) => {
            const isSelected = selected === meta.id;
            const Icon = PRESET_ICONS[meta.id as keyof typeof PRESET_ICONS];

            return (
              <button
                key={meta.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(meta.id)}
                className={`relative flex flex-col items-start p-3 rounded-2xl border text-left transition-all text-xs ${
                  isSelected
                    ? 'border-[var(--admin-tab-active-border)] bg-[var(--admin-surface)] text-[var(--admin-text-primary)] shadow-sm ring-1 ring-[var(--admin-tab-active-border)]'
                    : 'bg-[var(--admin-surface)] border-[var(--admin-border)] text-[var(--admin-text-secondary)] hover:border-[var(--admin-tab-active-border)]/60 hover:text-[var(--admin-text-primary)]'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="flex items-center gap-1.5 font-bold text-xs text-[var(--admin-text-primary)]">
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-[var(--admin-tab-active-border)]' : 'text-[var(--admin-text-muted)]'}`} />
                    {meta.label}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[var(--admin-tab-active-border)] shrink-0" />}
                </div>
                <p className="text-[10px] text-[var(--admin-text-muted)] line-clamp-2 leading-tight">
                  {meta.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom Reusable Mosque Frame Library */}
      <CustomFrameLibraryGrid
        selected={selected}
        selectedCustomUrl={selectedCustomUrl}
        disabled={Boolean(disabled)}
        isUploading={isUploading}
        isLoadingFrames={isLoadingFrames}
        uploadError={uploadError}
        customFrames={customFrames}
        fileInputRef={fileInputRef}
        onChange={onChange}
        onUploadFile={handleUploadFile}
        onDeleteFrame={handleDeleteFrame}
      />
    </div>
  );
}
