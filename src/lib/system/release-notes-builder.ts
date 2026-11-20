/**
 * Canonical Release Notes Formatter & Markdown Builder
 * Synchronizes GitHub Release text directly with the on-site release history.
 * MosqueSignage
 */

import { OFFICIAL_RELEASE_HISTORY, type ReleaseLogItem } from './release-history';

export const STANDARD_RELEASE_FOOTER = `---

<details>
<summary><strong>How to Download, Run &amp; Configure Autostart</strong></summary>

1. **Download the Release**:
   - Scroll down to the **Assets** section below and click **Source code (zip)**, then extract it to a folder (e.g. \`C:\\MosqueSignage\` or \`~/mosque-signage\`).
   - *(Or clone with Git: \`git clone https://github.com/GitCreativeCode/mosque-signage.git\`)*

2. **Run on Your System**:
   - **Windows 10 / 11** *(Requires [Node.js 22 LTS+](https://nodejs.org/))*:
     \`\`\`bash
     npm install
     npm start
     \`\`\`
   - **Linux, Raspberry Pi & macOS** *(Requires Node.js 22+)*:
     \`\`\`bash
     chmod +x start-signage.sh update.sh
     ./start-signage.sh
     \`\`\`
   - **Docker (Containerized)**:
     \`\`\`bash
     docker compose up -d
     \`\`\`

3. **Optional: Configure Autostart on Boot (Windows)**:
   \`\`\`bash
   npm run autostart
   \`\`\`
   Choose **TV Display Mode** (auto-starts server minimized + opens fullscreen TV kiosk) or **Server-Only Mode** (headless background service). Check status anytime with \`npm run autostart -- --status\`.

4. **Access the Appliance**:
   - **Display Screen (TVs / Kiosks)**: \`http://localhost:3000/display\`
   - **Admin Control Panel**: \`http://localhost:3000/admin\` *(Default PIN: \`1234\`)*
   - **Other Devices on Wi-Fi**: Replace \`localhost\` with your host computer's local IP (e.g. \`http://192.168.1.50:3000/admin\`).

5. **Full Documentation**:
   - See [README.md](https://github.com/GitCreativeCode/mosque-signage/blob/main/README.md), [Admin Handbook](https://github.com/GitCreativeCode/mosque-signage/blob/main/docs/admin-handbook.md), and [Deployment Guide](https://github.com/GitCreativeCode/mosque-signage/blob/main/docs/deployment.md).

</details>

<details>
<summary><strong>How to Update from an Existing Installation</strong></summary>

- **Windows / Linux / macOS (Git Installation)**:
  \`\`\`bash
  git pull origin main
  npm install
  npm run build
  npm start
  \`\`\`
  *(On Linux & macOS you can also run \`./update.sh\`. Your database and uploaded media are automatically preserved).*

- **ZIP Release (No Git - Safe Data Migration)**:
  1. Download the new release \`.zip\` from **Assets** below and extract it to a new folder (e.g. \`C:\\MosqueSignage-new\`).
  2. Stop your running MosqueSignage server (\`Ctrl+C\`), then open a terminal in the new folder and run:
     \`\`\`bash
     npm install
     npm run migrate-data "C:\\Path\\To\\Previous\\MosqueSignage"
     \`\`\`
  3. \`migrate-data\` automatically backs up any target database, transfers \`data/mosque_signage.db\` (plus WAL journals and session secrets), copies all uploaded flyers/videos in \`public/uploads/\`, and safely merges custom frames.

- **Docker**:
  \`\`\`bash
  git pull origin main
  docker compose up -d --build
  \`\`\`
  *(Persistent volumes \`mosque_data\` and \`mosque_uploads\` retain all database records and media).*

</details>`;

export function resolveReleaseItem(targetVersion?: string): ReleaseLogItem {
  const clean = targetVersion ? targetVersion.replace(/^v/, '').trim() : '';
  if (clean) {
    const found = OFFICIAL_RELEASE_HISTORY.find((r) => r.version === clean);
    if (found) return found;
  }
  return OFFICIAL_RELEASE_HISTORY[0]!;
}

export function buildReleaseTitle(item: ReleaseLogItem): string {
  if (item.title.startsWith('MosqueSignage')) {
    return item.title;
  }
  return `MosqueSignage ${item.title}`;
}

export function buildReleaseNotesMarkdown(item: ReleaseLogItem, includeFooter = true): string {
  const parts: string[] = [];

  if (item.summary) {
    parts.push(item.summary.trim());
  }

  if (item.highlights.length > 0) {
    const highlightLines = item.highlights.map((h) => `- ${h}`).join('\n');
    parts.push(`### Key Highlights\n${highlightLines}`);
  }

  if (item.sections && item.sections.length > 0) {
    for (const section of item.sections) {
      const itemLines = section.items.map((i) => `- ${i}`).join('\n');
      parts.push(`### ${section.title}\n${itemLines}`);
    }
  }

  if (includeFooter) {
    parts.push(STANDARD_RELEASE_FOOTER);
  }

  return parts.join('\n\n');
}

export function runReleaseNotesCli(): void {
  const args = process.argv.slice(2);
  let version = '';
  let titleOnly = false;
  let rawNotes = false;

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--version' && args[i + 1]) {
      version = args[++i]!;
    } else if (a === '--title-only') {
      titleOnly = true;
    } else if (a === '--raw-notes') {
      rawNotes = true;
    }
  }

  const item = resolveReleaseItem(version);
  if (titleOnly) {
    process.stdout.write(buildReleaseTitle(item) + '\n');
    return;
  }
  if (rawNotes) {
    process.stdout.write(buildReleaseNotesMarkdown(item, false) + '\n');
    return;
  }
  process.stdout.write(buildReleaseNotesMarkdown(item, true) + '\n');
}

