import { NextResponse } from 'next/server';
import { db } from '@/lib/db/client';
import { settingsTable } from '@/lib/db/schema';

export const dynamic = 'force-dynamic';

/**
 * Appliance Health Probe
 * Endpoint: /api/health
 * Verifies Node.js process health and SQLite database connectivity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Probe database connectivity via simple select
    const settings = await db.select().from(settingsTable).limit(1);

    return NextResponse.json(
      {
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: settings.length >= 0 ? 'healthy' : 'empty',
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('[API] /api/health database probe failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: 'unhealthy',
        error: 'Database health check failed',
      },
      { status: 503 }
    );
  }
}
