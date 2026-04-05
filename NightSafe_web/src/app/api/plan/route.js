import { NextResponse } from 'next/server';
import { planNightRoute } from '@/lib/server/nightsafePlanner';

export async function POST(request) {
  const payload = await request.json().catch(() => null);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const result = await planNightRoute(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Unable to create plan',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

