import { type NextRequest } from 'next/server';
import { serveMediaFile } from '@/lib/posters/media-serve';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> }
): Promise<Response> {
  const { path: segments } = await context.params;
  return serveMediaFile(request, segments);
}

