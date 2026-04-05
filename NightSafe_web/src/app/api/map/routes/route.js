import { NextResponse } from 'next/server';
import { getRoutesByPlanId } from '@/lib/server/nightsafePlanner';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('planId');

  if (!planId) {
    return NextResponse.json({ error: 'Missing planId' }, { status: 400 });
  }

  const routes = await getRoutesByPlanId(planId);

  if (!routes) {
    return NextResponse.json({ error: 'Plan not found or expired' }, { status: 404 });
  }

  return NextResponse.json(routes);
}

