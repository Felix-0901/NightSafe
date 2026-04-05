import { NextResponse } from 'next/server';
import { getMapLayers } from '@/lib/server/nightsafePlanner';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const layers = searchParams.get('layers') || '';

  const result = await getMapLayers({
    bbox,
    layers: layers.split(',').filter(Boolean),
  });

  return NextResponse.json(result);
}

