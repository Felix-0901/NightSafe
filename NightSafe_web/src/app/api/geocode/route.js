import { NextResponse } from 'next/server';
import { geocodePlace } from '@/lib/server/nightsafePlanner';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing q parameter' }, { status: 400 });
  }

  const result = await geocodePlace(query);

  if (!result) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  }

  return NextResponse.json(result);
}

