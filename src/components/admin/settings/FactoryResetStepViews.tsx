'use client';

import React from 'react';
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export function FactoryResetCompleteView({
  onAcknowledge,
}: {
  readonly onAcknowledge: () => void;
}) {
  return (
    <div className="space-y-5 animate-fadeIn text-center py-4">
      <div className="w-14 h-14 rounded-2xl bg-green-600/10 border border-green-600/30 flex items-center justify-center text-green-600 dark:text-green-400 mx-auto shadow-lg shadow-green-600/10">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-bold text-[var(--admin-text-primary)]">
          Factory Reset Completed Successfully!
        </h3>
        <p className="text-xs text-[var(--admin-text-muted)] max-w-sm mx-auto">
          All custom data, timetable overrides, and notices have been cleared.
          Default posters (&quot;Welcome to the Community Center&quot; &amp; &quot;Holy Month of Ramadan&quot;) are back in rotation.
        </p>
      </div>
      <div className="pt-3 flex items-center justify-center border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onAcknowledge}
          className="px-6 py-2.5 text-xs font-bold rounded-xl bg-green-600 hover:bg-green-700 text-white transition flex items-center space-x-2 shadow-lg shadow-green-600/30 cursor-pointer active:scale-95"
        >
          <span>Okay</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function FactoryResetIntentStep({
  onCancel,
  onContinue,
}: {
  readonly onCancel: () => void;
  readonly onContinue: () => void;
}) {
  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <h3 id="factory-reset-modal-title" className="text-base font-bold text-rose-600 dark:text-rose-500">
            Are you sure you want to reset everything?
          </h3>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            This action is permanent and cannot be undone. All custom content will be erased.
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 space-y-2">
        <p className="font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider text-[10px]">What Will Be Cleared:</p>
        <ul className="list-disc list-inside space-y-1.5 text-[11px] text-rose-800/90 dark:text-rose-300/90 pl-0.5">
          <li>Venue identity, timezone, and marquee ticker announcements</li>
          <li>Custom flyers, notices, video slides, frames &amp; layout posters</li>
          <li>Prayer calculation rules, manual overrides, annual CSV, Jummah &amp; seasonal schedules</li>
          <li>Display choreography, TV auto-power &amp; audio receiver settings</li>
          <li>Admin Password &amp; custom PIN (resets to PIN Mode with default PIN 1234)</li>
        </ul>
      </div>

      <div className="pt-2 flex items-center justify-end space-x-3 border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1.5 shadow-md shadow-rose-600/30 cursor-pointer active:scale-95"
        >
          <span>Yes, Continue</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FactoryResetConfirmWordStep({
  confirmText,
  onChangeConfirmText,
  onBack,
  onContinue,
}: {
  readonly confirmText: string;
  readonly onChangeConfirmText: (val: string) => void;
  readonly onBack: () => void;
  readonly onContinue: () => void;
}) {
  const isConfirmValid = confirmText.trim() === 'CONFIRM';

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="flex items-start space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-rose-500">Type CONFIRM to Proceed</h3>
          <p className="text-xs text-[var(--admin-text-muted)] mt-1">
            Please type the confirmation word in CAPITAL letters below to unlock PIN authorization.
          </p>
        </div>
      </div>

      <div className="space-y-2 p-4 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]/70">
        <label className="block text-xs font-semibold text-[var(--admin-text-secondary)]">
          Type <span className="font-mono font-bold text-rose-500">CONFIRM</span>:
        </label>
        <input
          type="text"
          autoFocus
          value={confirmText}
          onChange={(e) => onChangeConfirmText(e.target.value)}
          placeholder="CONFIRM"
          className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] text-[var(--admin-text-primary)] font-mono placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-rose-500 tracking-widest text-center font-bold text-sm"
        />
        <p className="text-[11px] text-[var(--admin-text-muted)] text-center">
          Case-sensitive. Must be typed in CAPITAL letters (use Shift or Caps Lock).
        </p>
      </div>

      <div className="pt-2 flex items-center justify-between border-t border-[var(--admin-border)]">
        <button
          type="button"
          onClick={onBack}
          className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] transition flex items-center space-x-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Go Back</span>
        </button>

        <button
          type="button"
          disabled={!isConfirmValid}
          onClick={onContinue}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 ${
            isConfirmValid
              ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-md shadow-rose-600/30 active:scale-95'
              : 'bg-rose-900/30 text-rose-300/40 border border-rose-900/40 cursor-not-allowed opacity-40'
          }`}
        >
          <span>Next: Enter PIN</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
