import { NextResponse } from 'next/server';
import { getPublicActivePosters } from '@/lib/actions/posters';
import { verifyCurrentDisplaySession } from '@/lib/auth/display-pairing';

export const dynamic = 'force-dynamic';

/**
 * Public Active Posters & Notices REST API Endpoint
 * Endpoint: GET /api/posters
 *
 * Provides a low-latency, zero-cache JSON representation of strictly ACTIVE
 * posters currently eligible for presentation on the display kiosk.
 * Gated by display pairing session if pairing mode is active.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const isAuthorized = await verifyCurrentDisplaySession();
    if (!isAuthorized) {
      return NextResponse.json(
        { error: 'Unauthorized: Display pairing or admin authentication required.' },
        { status: 401 }
      );
    }

    const { posters, nextTransitionAt } = await getPublicActivePosters();
    const headers: Record<string, string> = {
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    if (nextTransitionAt) {
      headers['X-Next-Transition-At'] = nextTransitionAt;
    }

    return NextResponse.json(posters, { headers });
  } catch (err) {
    console.error('[API] /api/posters fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to load posters' },
      { status: 500 }
    );
  }
}
