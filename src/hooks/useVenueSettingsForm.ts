'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Settings, VenueSettingsCategory } from '@/types/index';
import { broadcastSignageEvent } from '@/lib/events/broadcast-channel';
import {
  buildDraftFromSettings,
  buildUpdatePayloadFromDraft,
  resolveVenueSettingsCategory,
  type VenueSettingsDraft,
} from '@/lib/settings-draft';

export type { VenueSettingsDraft };

export function useVenueSettingsForm({
  settings,
  onRefresh,
  onDirtyChange,
  initialSubTab,
  activeCategoryProp,
  onCategoryChange,
}: {
  readonly settings: Settings;
  readonly onRefresh: () => void;
  readonly onDirtyChange?: ((isDirty: boolean) => void) | undefined;
  readonly initialSubTab?: string | undefined;
  readonly activeCategoryProp?: VenueSettingsCategory | undefined;
  readonly onCategoryChange?: ((cat: VenueSettingsCategory) => void) | undefined;
}) {
  const [activeCategory, setActiveCategory] = useState<VenueSettingsCategory>(
    () => activeCategoryProp ?? resolveVenueSettingsCategory(initialSubTab)
  );
  const [draft, setDraft] = useState<VenueSettingsDraft>(() => buildDraftFromSettings(settings));
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [detectLocationMsg, setDetectLocationMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (activeCategoryProp && activeCategoryProp !== activeCategory) setActiveCategory(activeCategoryProp);
  }, [activeCategoryProp, activeCategory]);

  useEffect(() => {
    const onPopState = () => {
      if (typeof window === 'undefined') return;
      const resolved = resolveVenueSettingsCategory(new URLSearchParams(window.location.search).get('sub') ?? undefined);
      setActiveCategory(resolved);
      onCategoryChange?.(resolved);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [onCategoryChange]);

  useEffect(() => { onDirtyChange?.(isDirty); }, [isDirty, onDirtyChange]);
  useEffect(() => { setDraft(buildDraftFromSettings(settings)); }, [settings]);

  const markDirty = useCallback(() => setIsDirty(true), []);
  const updateField = useCallback(<K extends keyof VenueSettingsDraft>(key: K, val: VenueSettingsDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: val }));
  }, []);

  const handleCategoryChange = (cat: VenueSettingsCategory) => {
    setActiveCategory(cat);
    onCategoryChange?.(cat);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (cat === 'IDENTITY') url.searchParams.delete('sub');
    else url.searchParams.set('sub', cat.toLowerCase());
    window.history.replaceState(null, '', url.pathname + url.search);
  };

  const handleAutoDetectLocation = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setDetectLocationMsg('Geolocation is not supported by your browser.');
      return;
    }
    setIsDetectingLocation(true);
    setDetectLocationMsg(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(4));
        const lng = parseFloat(pos.coords.longitude.toFixed(4));
        setDraft((prev) => ({ ...prev, latitude: lat, longitude: lng }));
        setIsDirty(true);
        setIsDetectingLocation(false);
        setDetectLocationMsg(`Detected GPS: ${lat}, ${lng}`);
        setTimeout(() => setDetectLocationMsg(null), 4000);
      },
      (err) => {
        setIsDetectingLocation(false);
        setDetectLocationMsg(err.message || 'Unable to retrieve GPS coordinates.');
        setTimeout(() => setDetectLocationMsg(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    try {
      const { updateVenueSettings, updateTicker } = await import('@/lib/actions/settings');
      await updateVenueSettings(buildUpdatePayloadFromDraft(draft));
      await updateTicker(draft.tickerText.trim());
      setSaveSuccess(true);
      setIsDirty(false);
      setTimeout(() => setSaveSuccess(false), 3000);
      onRefresh();
      broadcastSignageEvent({ type: 'SETTINGS_UPDATED' });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    activeCategory, handleCategoryChange, draft, updateField, markDirty,
    isDetectingLocation, detectLocationMsg, handleAutoDetectLocation,
    isSaving, saveSuccess, error, handleSave,
  };
}
