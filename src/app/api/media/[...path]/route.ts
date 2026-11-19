import { type NextRequest, NextResponse } from 'next/server';
import { verifyCurrentDisplaySession } from '@/lib/auth/display-pairing';
import { serveMediaFile } from '@/lib/posters/media-serve';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const isAuthorized = await verifyCurrentDisplaySession();
  if (!isAuthorized) {
    return NextResponse.json(
      { error: 'Unauthorized: Display pairing or admin session required to access media.' },
      { status: 401 }
    );
  }

  const { path: segments } = await context.params;
  return serveMediaFile(request, segments);
}
