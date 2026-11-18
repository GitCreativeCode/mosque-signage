import React from 'react';

export default function Loading() {
  return (
    <div className="fixed inset-x-0 top-0 z-50 pointer-events-none">
      {/* Top progress bar animation */}
      <div className="h-0.5 w-full bg-[var(--admin-border)] overflow-hidden">
        <div className="h-full bg-green-600 dark:bg-green-500 animate-top-loading-bar" />
      </div>
    </div>
  );
}
