import { NextResponse } from 'next/server';
import { checkAdminAuth } from '@/lib/actions/auth';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const dynamic = 'force-dynamic';

/**
 * POST /api/system/update
 * Initiates an appliance update when triggered by an authenticated administrator.
 */
export async function POST() {
  try {
    const { authenticated } = await checkAdminAuth();
    if (!authenticated) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin session required to trigger system updates.' },
        { status: 401 }
      );
    }

    // In Docker or production environment, we can check for an update command or script
    const updateCommand = process.env['MOSQUE_UPDATE_COMMAND'];

    if (updateCommand) {
      const { stdout, stderr } = await execAsync(updateCommand, { timeout: 120000 });
      return NextResponse.json({
        success: true,
        message: 'Update command completed successfully.',
        output: stdout || stderr,
      });
    }

    // Standard local fallback (git pull if git exists)
    try {
      let pullResult = '';
      try {
        const { stdout } = await execAsync('git pull origin main', { timeout: 60000 });
        pullResult = stdout;
      } catch {
        const { stdout } = await execAsync('git pull', { timeout: 60000 });
        pullResult = stdout;
      }

      return NextResponse.json({
        success: true,
        message: 'Appliance repository updated successfully. Run "npm run build && npm start" in your terminal to finalize.',
        output: pullResult,
      });
    } catch {
      // If git pull fails or not in git repo, provide clear instructions
      return NextResponse.json({
        success: false,
        error: 'No Git repository detected (ZIP installation). Please download the new release ZIP from GitHub Releases. If extracting into a new folder, run "npm run migrate-data <old-folder-path>" to copy your database and media, then run "npm install && npm start".',
        output: 'Manual ZIP update required.',
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Update execution failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

