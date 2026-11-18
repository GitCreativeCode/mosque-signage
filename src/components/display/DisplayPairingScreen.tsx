'use client';

/**
 * Display Pairing Screen for Locked Kiosks
 * MosqueSignage (TV)
 */

import React, { useState, useEffect } from 'react';
import { KeyRound, Loader2, ShieldAlert } from 'lucide-react';
import { redeemDisplayPairingCode } from '@/lib/auth/display-pairing';

export interface DisplayPairingScreenProps {
  readonly mosqueName: string;
  readonly greeting?: string | undefined;
}

export function DisplayPairingScreen({ mosqueName, greeting }: DisplayPairingScreenProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically unlock and refresh if Protected Mode is disabled in settings
  useEffect(() => {
    let isCancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/display/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { authorized?: boolean };
        if (data?.authorized && !isCancelled) {
          window.location.reload();
        }
      } catch {
        // Blip in network, keep checking
      }
    }, 3000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (clean.length !== 6) {
      setError('Please enter a valid 6-character code.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let res: { success: boolean; error?: string };
      try {
        res = await redeemDisplayPairingCode(clean);
      } catch {
        // Fallback to REST endpoint if Server Action fails due to dev rebuild mismatch (409)
        const fetchRes = await fetch('/api/display/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: clean }),
        });
        res = (await fetchRes.json()) as { success: boolean; error?: string };
      }

      if (res.success) {
        window.location.reload();
      } else {
        setError(res.error ?? 'Invalid pairing code.');
      }
    } catch {
      setError('Connection failed. Please verify network and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0d0e12] text-white flex flex-col items-center justify-center p-6 select-none font-sans z-50">
      <div className="max-w-md w-full bg-[#181a20] border border-[#2a2d36] rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <KeyRound className="w-8 h-8" />
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-neutral-400 font-semibold">
            {greeting ?? 'Welcome to'}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">{mosqueName}</h1>
          <p className="text-xs text-neutral-400 pt-1">
            Display protection is active. Enter an authorized pairing code to activate this screen.
          </p>
        </div>

        {error && (
          <div className="w-full p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2 text-left">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="text"
            maxLength={6}
            autoFocus
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''));
              setError(null);
            }}
            placeholder="••••••"
            aria-label="6-character pairing code"
            className="w-full text-center text-3xl font-mono tracking-[0.4em] py-3 px-4 rounded-xl border border-[#2e323b] bg-[#111216] text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 font-bold placeholder:tracking-normal placeholder:text-neutral-600"
          />

          <button
            type="submit"
            disabled={isSubmitting || code.length !== 6}
            className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-neutral-950 font-bold text-sm flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span>Pair This Display</span>
            )}
          </button>
        </form>

        <p className="text-[11px] text-neutral-500 leading-relaxed">
          An administrator can generate a single-use pairing code inside{' '}
          <span className="font-semibold text-neutral-400">Venue Settings &rarr; Appliance & Security</span>.
        </p>
      </div>
    </div>
  );
}

