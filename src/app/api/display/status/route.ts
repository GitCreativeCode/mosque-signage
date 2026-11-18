/**
 * Display Authorization & Status REST Endpoint
 * MosqueSignage (TV)
 */

import { getVenueSettingsCore } from '@/lib/actions/settings';
import {
  redeemDisplayPairingCode,
  verifyCurrentDisplaySession,
} from '@/lib/auth/display-pairing';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<Response> {
  const [authorized, settings] = await Promise.all([
    verifyCurrentDisplaySession(),
    getVenueSettingsCore(),
  ]);

  return Response.json({
    authorized,
    accessMode: settings.display_access_mode,
  });
}

export async function POST(req: Request): Promise<Response> {
  try {
    const body = (await req.json()) as { code?: string };
    if (!body?.code || typeof body.code !== 'string') {
      return Response.json(
        { success: false, error: 'A 6-character pairing code is required.' },
        { status: 400 }
      );
    }

    const result = await redeemDisplayPairingCode(body.code);
    return Response.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return Response.json(
      { success: false, error: 'Failed to process display pairing code.' },
      { status: 500 }
    );
  }
}

