'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Compass, Loader2, Sliders, X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import type { PrayerName, PrayerRule } from '@/types/index';
import { getAdhanOffsets, getPrayerRules, saveAdhanOffsets, savePrayerRule } from '@/lib/actions/prayers';
import { AdhanOffsetsTabPanel } from './AdhanOffsetsTabPanel';
import { IQAMAH_PRAYERS_CONFIG, IqamahRulesTabPanel, type RuleItemState } from './IqamahRulesTabPanel';

export interface CalculationRulesModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onRulesSaved?: (() => void) | undefined;
  readonly initialRules?: readonly PrayerRule[] | undefined;
}

const DEFAULT_PRAYER_RULES: Record<PrayerName, RuleItemState> = {
  fajr: { type: 'OFFSET', offset: 25, fixed: '06:00' },
  sunrise: { type: 'OFFSET', offset: 0, fixed: '07:00' },
  dhuhr: { type: 'FIXED', offset: 20, fixed: '13:30' },
  asr: { type: 'OFFSET', offset: 15, fixed: '17:00' },
  maghrib: { type: 'OFFSET', offset: 5, fixed: '19:00' },
  isha: { type: 'FIXED', offset: 15, fixed: '20:30' },
};

function mergePrayerRulesIntoState(
  base: Record<PrayerName, RuleItemState>,
  rules: readonly PrayerRule[]
): Record<PrayerName, RuleItemState> {
  const next = { ...base };
  for (const p of IQAMAH_PRAYERS_CONFIG) {
    const found = rules.find((r) => r.prayer.toLowerCase() === p.name.toLowerCase());
    if (found) {
      next[p.name] = {
        type: found.rule_type,
        offset: found.offset_minutes ?? 15,
        fixed: found.fixed_time ?? '13:30',
      };
    }
  }
  return next;
}

export function CalculationRulesModal({
  isOpen,
  onClose,
  onRulesSaved,
  initialRules = [],
}: CalculationRulesModalProps) {
  const [activeTab, setActiveTab] = useState<'ADHAN_OFFSETS' | 'IQAMAH_RULES'>('ADHAN_OFFSETS');
  const [rulesState, setRulesState] = useState<Record<PrayerName, RuleItemState>>(
    () => mergePrayerRulesIntoState(DEFAULT_PRAYER_RULES, initialRules)
  );
  const [adhanOffsets, setAdhanOffsets] = useState<Record<PrayerName, number>>({
    fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const modalRef = useFocusTrap({ isActive: isOpen, onEscape: onClose });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [liveRules, liveOffsets] = await Promise.all([getPrayerRules(), getAdhanOffsets()]);
        if (!mounted) return;
        setRulesState((prev) => mergePrayerRulesIntoState(prev, liveRules));
        setAdhanOffsets(liveOffsets);
      } catch (err) {
        if (mounted) console.error('Failed to load prayer calculation rules:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void load();
    return () => { mounted = false; };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      for (const p of IQAMAH_PRAYERS_CONFIG) {
        const r = rulesState[p.name];
        if (!r) continue;
        await savePrayerRule({
          prayer: p.name,
          rule_type: r.type,
          offset_minutes: r.type === 'OFFSET' ? r.offset : undefined,
          fixed_time: r.type === 'FIXED' ? r.fixed : undefined,
        });
      }
      await saveAdhanOffsets(adhanOffsets);
      setSuccessMessage('Calculation rules and Adhan offsets saved successfully.');
      onRulesSaved?.();
      setTimeout(onClose, 700);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save calculation rules.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calculation-rules-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={modalRef}
        className="w-full max-w-xl bg-[var(--admin-card)] border border-[var(--admin-border)] rounded-2xl p-6 shadow-2xl text-[var(--admin-text-primary)]"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[var(--admin-border)] mb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-[var(--admin-surface)] border border-[var(--admin-border)] text-[var(--admin-text-primary)]">
              <Sliders className="w-4 h-4 opacity-80" />
            </div>
            <div>
              <h3 id="calculation-rules-modal-title" className="text-base font-bold text-[var(--admin-text-primary)] tracking-tight">Calculation Rules &amp; Adhan Offsets</h3>
              <p className="text-xs text-[var(--admin-text-muted)] mt-0.5">Configure astronomical Adhan buffers and automated Iqamah formulas.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close calculation rules dialog"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center space-x-1.5 bg-[var(--admin-surface)] p-1 rounded-xl border border-[var(--admin-border)] mb-4">
          <button type="button" onClick={() => setActiveTab('ADHAN_OFFSETS')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${activeTab === 'ADHAN_OFFSETS' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
            <Compass className="w-3.5 h-3.5" /><span>Adhan Offsets (Buffers)</span>
          </button>
          <button type="button" onClick={() => setActiveTab('IQAMAH_RULES')} className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1.5 transition cursor-pointer ${activeTab === 'IQAMAH_RULES' ? 'bg-[var(--admin-card)] text-[var(--admin-text-primary)] shadow-sm border border-[var(--admin-border)]' : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)]'}`}>
            <Clock className="w-3.5 h-3.5" /><span>Iqamah Calculation Rules</span>
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" /><span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[var(--admin-success-subtle)] border border-[var(--admin-success)]/20 text-xs text-[var(--admin-success)] flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--admin-success)]" /><span>{successMessage}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-[var(--admin-text-primary)] opacity-60" />
            <span className="text-xs text-[var(--admin-text-muted)]">Loading calculation rules &amp; offsets...</span>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            {activeTab === 'ADHAN_OFFSETS' ? (
              <AdhanOffsetsTabPanel
                adhanOffsets={adhanOffsets}
                onAdjustOffset={(prayer, delta) => setAdhanOffsets((p) => ({ ...p, [prayer]: Math.max(-30, Math.min(30, (p[prayer] ?? 0) + delta)) }))}
                onSetDirectOffset={(prayer, valStr) => {
                  const parsed = parseInt(valStr, 10);
                  setAdhanOffsets((p) => ({ ...p, [prayer]: Number.isNaN(parsed) ? 0 : Math.max(-30, Math.min(30, parsed)) }));
                }}
                onApplyPrecautionaryDefaults={() => setAdhanOffsets({ fajr: 2, sunrise: 0, dhuhr: 5, asr: 0, maghrib: 3, isha: 0 })}
                onResetOffsets={() => setAdhanOffsets({ fajr: 0, sunrise: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 })}
              />
            ) : (
              <IqamahRulesTabPanel
                rulesState={rulesState}
                onUpdateRule={(prayer, patch) => setRulesState((p) => ({ ...p, [prayer]: { ...p[prayer], ...patch } }))}
              />
            )}

            <div className="flex items-center justify-end space-x-2.5 pt-4 border-t border-[var(--admin-border)]">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-[var(--admin-btn-secondary-border)] bg-[var(--admin-btn-secondary-bg)] hover:bg-[var(--admin-btn-secondary-hover)] text-[var(--admin-btn-secondary-text)] text-xs font-medium transition cursor-pointer">Cancel</button>
              <button type="submit" disabled={isSaving} className="px-5 py-2 rounded-xl bg-[var(--admin-btn-primary-bg)] hover:bg-[var(--admin-btn-primary-hover)] text-[var(--admin-btn-primary-text)] font-semibold text-xs flex items-center space-x-1.5 transition active:scale-[0.98] cursor-pointer disabled:opacity-50 shadow-sm">
                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}<span>Save All Rules &amp; Offsets</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
