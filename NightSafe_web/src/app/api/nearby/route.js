import { NextResponse } from 'next/server';
import { getNearbyResources } from '@/lib/server/nightsafePlanner';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = Number(searchParams.get('lat'));
  const lng = Number(searchParams.get('lng'));

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json({ error: 'Missing lat/lng' }, { status: 400 });
  }

  const radiusMeters = Number(searchParams.get('radius') || '600');
  const items = await getNearbyResources({ lat, lng, radiusMeters });

  return NextResponse.json({ items, radiusMeters });
}
