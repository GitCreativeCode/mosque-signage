'use client';

import React, { useState } from 'react';
import { Check, Copy, FolderDown, GitBranch, Terminal } from 'lucide-react';

export function ApplianceUpdateTerminalGuide() {
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [showTerminalGuide, setShowTerminalGuide] = useState(false);

  const gitCommand = 'git pull origin main && npm install && npm run build';
  const dockerCommand = 'docker compose pull && docker compose up -d';
  const shCommand = './update.sh';

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCmd(id);
    setTimeout(() => setCopiedCmd(null), 2500);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowTerminalGuide(!showTerminalGuide)}
        className="w-full py-2 text-[11px] text-[var(--admin-text-muted)] hover:text-[var(--admin-text-primary)] transition flex items-center justify-center space-x-1.5 cursor-pointer"
      >
        <Terminal className="w-3.5 h-3.5" />
        <span>{showTerminalGuide ? 'Hide Terminal & Manual Instructions' : 'Prefer terminal or manual update steps?'}</span>
      </button>

      {showTerminalGuide && (
        <div className="p-3.5 rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] space-y-3.5 text-xs">
          {/* Git Standalone (Windows, macOS, Linux) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--admin-text-muted)]">
              <span className="flex items-center space-x-1">
                <GitBranch className="w-3 h-3 text-[var(--admin-text-secondary)]" />
                <span>Git Installation (Windows, macOS, Linux):</span>
              </span>
              <button
                type="button"
                onClick={() => copyToClipboard(gitCommand, 'git')}
                className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-500 transition cursor-pointer"
              >
                {copiedCmd === 'git' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd === 'git' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-xl bg-black/40 border border-[var(--admin-border)] font-mono text-[10px] text-green-400 dark:text-green-300 overflow-x-auto">
              {gitCommand}
            </code>
          </div>

          {/* ZIP Archive Release (No-Git / Windows) */}
          <div className="space-y-1.5 p-2.5 rounded-xl bg-[var(--admin-card)] border border-[var(--admin-border)]">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-[var(--admin-text-primary)]">
              <FolderDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>ZIP Download Installation (No Git):</span>
            </div>
            <ol className="list-decimal list-inside text-[11px] text-[var(--admin-text-muted)] space-y-1 pl-1 leading-relaxed">
              <li>Download the new release ZIP from GitHub Releases and extract it to a folder.</li>
              <li>In the extracted folder, run: <code className="text-[var(--admin-text-primary)] font-mono font-bold">npm install</code></li>
              <li>Migrate your data: <code className="text-emerald-500 font-mono font-bold">npm run migrate-data &quot;&lt;old-folder-path&gt;&quot;</code></li>
              <li>Start the appliance: <code className="text-[var(--admin-text-primary)] font-mono font-bold">npm start</code></li>
            </ol>
          </div>

          {/* macOS & Linux Shell Script */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--admin-text-muted)]">
              <span>macOS &amp; Linux 1-Click Script:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(shCommand, 'sh')}
                className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-500 transition cursor-pointer"
              >
                {copiedCmd === 'sh' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd === 'sh' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-xl bg-black/40 border border-[var(--admin-border)] font-mono text-[10px] text-green-400 dark:text-green-300 overflow-x-auto">
              {shCommand}
            </code>
          </div>

          {/* Docker Compose Deployment */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--admin-text-muted)]">
              <span>Docker Compose Deployment:</span>
              <button
                type="button"
                onClick={() => copyToClipboard(dockerCommand, 'docker')}
                className="flex items-center space-x-1 text-green-600 dark:text-green-400 hover:text-green-500 transition cursor-pointer"
              >
                {copiedCmd === 'docker' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{copiedCmd === 'docker' ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <code className="block p-2 rounded-xl bg-black/40 border border-[var(--admin-border)] font-mono text-[10px] text-green-400 dark:text-green-300 overflow-x-auto">
              {dockerCommand}
            </code>
          </div>
        </div>
      )}
    </>
  );
}

