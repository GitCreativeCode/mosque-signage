import React from 'react';
import Link from 'next/link';
import { LayoutDashboard, Tv } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--admin-bg)] text-[var(--admin-text-primary)] text-center font-sans selection:bg-emerald-500/20">
      <div className="max-w-md w-full space-y-6">
        <div className="space-y-2">
          <span className="text-6xl font-black text-emerald-500 font-mono tracking-tight">404</span>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--admin-text-primary)]">
            Page Not Found
          </h1>
          <p className="text-xs sm:text-sm text-[var(--admin-text-muted)] leading-relaxed">
            The requested address could not be found. You may return to the administration dashboard or the live display screen.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/admin"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/30 cursor-pointer active:scale-95"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Return to Admin Dashboard</span>
          </Link>

          <Link
            href="/display"
            className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-card)] hover:bg-[var(--admin-surface)] text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)] font-semibold text-xs transition shadow-xs cursor-pointer active:scale-95"
          >
            <Tv className="w-4 h-4" />
            <span>Open Live Display</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
