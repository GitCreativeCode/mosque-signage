import { NextResponse } from 'next/server';
import { checkLatestRelease } from '@/lib/system/version';
import { checkAdminAuth } from '@/lib/actions/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/system/version
 * Checks the official public repository for updates.
 * Force refresh (?force=true) is strictly gated behind admin authentication
 * to prevent unauthenticated outbound GitHub API rate-limit exhaustion.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRequested = searchParams.get('force') === 'true';
    let force = false;

    if (forceRequested) {
      const { authenticated } = await checkAdminAuth();
      if (authenticated) {
        force = true;
      }
    }

    const result = await checkLatestRelease(undefined, force);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
