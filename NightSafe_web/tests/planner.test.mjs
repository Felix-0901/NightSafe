import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildPlanId,
  getMapLayers,
  normalizePlannerInput,
  planNightRoute,
} from '../src/lib/server/nightsafePlanner.js';

test('normalizePlannerInput keeps defaults and parses prefs', () => {
  const plan = normalizePlannerInput({
    from: '台北車站',
    to: '永春站',
    time: '22:10',
    prefs: 'bright-route,main-road',
  });

  assert.deepEqual(plan, {
    from: '台北車站',
    to: '永春站',
    time: '22:10',
    prefs: ['bright-route', 'main-road'],
  });
});

test('buildPlanId is stable for the same payload', () => {
  const plan = normalizePlannerInput({ from: '台北車站', to: '永春站', time: '21:30' });

  assert.equal(buildPlanId(plan), buildPlanId(plan));
  assert.notEqual(buildPlanId(plan), buildPlanId({ ...plan, to: '板橋車站' }));
});

test('getMapLayers filters features by bbox and requested layers', async () => {
  const payload = await getMapLayers({
    bbox: '25.036000,121.560000,25.045000,121.570000',
    layers: ['police', 'cctv'],
  });

  const layerKeys = Object.keys(payload.featuresByLayer);
  assert(layerKeys.includes('police') || layerKeys.includes('cctv'));
  assert(layerKeys.every((key) => ['police', 'cctv'].includes(key)));
});

test('planNightRoute returns three scored route options and summary', async () => {
  const result = await planNightRoute({
    from: '台北車站',
    to: '永春站',
    time: '21:30',
    prefs: ['bright-route', 'main-road'],
  });

  assert.equal(result.routes.length, 3);
  assert.equal(typeof result.planId, 'string');
  assert.equal(result.recommendedRouteId, result.routes[0].id);
  assert(result.routes.every((route) => Array.isArray(route.geometry) && route.geometry.length >= 2));
  assert(result.routes.every((route) => typeof route.nightScore === 'number'));
  assert.equal(result.summary.checklist.length, 3);
});
