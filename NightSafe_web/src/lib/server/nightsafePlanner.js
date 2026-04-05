import crypto from 'node:crypto';
import { publicDataCatalog, publicDataSummary } from '../../data/publicDataCatalog.js';
import { knownPlaceSeeds, officialSnapshotFeatures } from '../../data/officialSafetyData.js';
import { getCachedValue, withCache } from './memoryCache.js';
import {
  computeBoundingBox,
  decodePolylineCoordinates,
  encodeLeafletCoordinates,
  expandBoundingBox,
  findNearestFeature,
  haversineDistanceMeters,
  isPointInBounds,
  sampleAlongCoordinates,
} from './spatial.js';

const GEOCODE_TTL = 1000 * 60 * 60 * 12;
const PLAN_TTL = 1000 * 60 * 5;
const LAYERS_TTL = 1000 * 60 * 3;

const MODE_LABELS = {
  taxi: '計程車直達',
  walk: '步行主線',
  bike: 'YouBike / 自行車',
};

const WEATHER_FALLBACK = {
  location: '臺北市 / 新北市',
  rainProbability: 20,
  summary: '未配置氣象署金鑰，使用保守環境估值。',
  temperature: 24,
};

const AQI_FALLBACK = {
  location: '雙北測站平均',
  aqi: 48,
  status: '普通',
  summary: '未配置環境部來源時，以雙北常態空品估值作修正。',
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function safeJsonParse(content) {
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export function normalizePlannerInput(input = {}) {
  const from = typeof input.from === 'string' ? input.from.trim() : '';
  const to = typeof input.to === 'string' ? input.to.trim() : '';
  const time = typeof input.time === 'string' && input.time ? input.time : '21:30';
  const prefs = Array.isArray(input.prefs)
    ? input.prefs.filter(Boolean)
    : typeof input.prefs === 'string'
      ? input.prefs.split(',').map((item) => item.trim()).filter(Boolean)
      : [];

  return {
    from: from || '台北車站',
    to: to || '永春站',
    time,
    prefs,
  };
}

export function serializePlannerState(plan, extra = {}) {
  const params = new URLSearchParams();
  const payload = { ...plan, ...extra };

  if (payload.from) params.set('from', payload.from);
  if (payload.to) params.set('to', payload.to);
  if (payload.time) params.set('time', payload.time);
  if (payload.planId) params.set('planId', payload.planId);

  const prefs = Array.isArray(payload.prefs) ? payload.prefs.filter(Boolean) : [];
  if (prefs.length) {
    params.set('prefs', prefs.join(','));
  }

  if (payload.route) params.set('route', payload.route);

  return params.toString();
}

export function buildPlanId(plan) {
  return crypto.createHash('sha1').update(JSON.stringify(plan)).digest('hex').slice(0, 16);
}

async function fetchJson(url, init = {}) {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Upstream request failed: ${response.status}`);
  }
  return response.json();
}

function lookupSeedPlace(query) {
  const normalized = query.replace(/\s+/g, '');

  return knownPlaceSeeds.find((place) => {
    const candidates = [place.name, ...(place.aliases || [])];
    return candidates.some((candidate) => normalized.includes(candidate.replace(/\s+/g, '')));
  });
}

export async function geocodePlace(query) {
  const trimmedQuery = `${query || ''}`.trim();

  if (!trimmedQuery) {
    return null;
  }

  return withCache(`geocode:${trimmedQuery}`, GEOCODE_TTL, async () => {
    const seed = lookupSeedPlace(trimmedQuery);
    if (seed) {
      return {
        query: trimmedQuery,
        name: seed.name,
        city: seed.city,
        lat: seed.lat,
        lng: seed.lng,
        source: 'seed',
      };
    }

    try {
      const searchUrl = new URL('https://nominatim.openstreetmap.org/search');
      searchUrl.searchParams.set('q', trimmedQuery);
      searchUrl.searchParams.set('format', 'jsonv2');
      searchUrl.searchParams.set('limit', '5');
      searchUrl.searchParams.set('countrycodes', 'tw');
      searchUrl.searchParams.set('viewbox', '121.243,25.257,121.690,24.898');
      searchUrl.searchParams.set('bounded', '1');

      const results = await fetchJson(searchUrl.toString(), {
        headers: {
          'Accept-Language': 'zh-TW,zh;q=0.9,en;q=0.8',
          'User-Agent': 'NightSafe/2.0 (night mobility planner)',
        },
        next: { revalidate: 3600 },
      });

      if (!Array.isArray(results) || !results.length) {
        return seed
          ? {
            query: trimmedQuery,
            name: seed.name,
            city: seed.city,
            lat: seed.lat,
            lng: seed.lng,
            source: 'seed',
          }
          : null;
      }

      const item = results[0];
      return {
        query: trimmedQuery,
        name: item.display_name.split(',')[0],
        city: item.display_name.includes('New Taipei') || item.display_name.includes('新北')
          ? '新北市'
          : '臺北市',
        lat: Number(item.lat),
        lng: Number(item.lon),
        source: 'nominatim',
        displayName: item.display_name,
      };
    } catch {
      return seed
        ? {
          query: trimmedQuery,
          name: seed.name,
          city: seed.city,
          lat: seed.lat,
          lng: seed.lng,
          source: 'seed',
        }
        : null;
    }
  });
}

function createLineFallback(from, to) {
  return {
    geometry: encodeLeafletCoordinates([
      { lat: from.lat, lng: from.lng },
      { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 },
      { lat: to.lat, lng: to.lng },
    ]),
    durationMinutes: Math.max(8, Math.round(haversineDistanceMeters(from, to) / 85 / 60)),
    distanceMeters: Math.round(haversineDistanceMeters(from, to)),
  };
}

async function fetchOsrmRoute(profile, coordinates, options = {}) {
  const pairs = coordinates.map((point) => `${point.lng},${point.lat}`).join(';');
  const url = new URL(`https://router.project-osrm.org/route/v1/${profile}/${pairs}`);
  url.searchParams.set('overview', 'full');
  url.searchParams.set('geometries', 'geojson');
  url.searchParams.set('steps', 'true');
  url.searchParams.set('annotations', 'distance,duration');
  if (options.continueStraight) {
    url.searchParams.set('continue_straight', 'true');
  }

  try {
    const data = await fetchJson(url.toString(), {
      headers: { 'User-Agent': 'NightSafe/2.0 (night mobility planner)' },
      next: { revalidate: 300 },
    });

    const route = data.routes?.[0];
    if (!route) {
      throw new Error('No OSRM route');
    }

    return {
      geometry: encodeLeafletCoordinates(decodePolylineCoordinates(route.geometry.coordinates)),
      durationMinutes: Math.max(1, Math.round(route.duration / 60)),
      distanceMeters: Math.round(route.distance),
      rawLegs: route.legs || [],
      source: 'osrm',
    };
  } catch {
    return {
      ...createLineFallback(coordinates[0], coordinates[coordinates.length - 1]),
      source: 'fallback',
    };
  }
}

function getTimeProfile(time) {
  const [hours = '21', minutes = '30'] = `${time || '21:30'}`.split(':');
  const totalMinutes = Number(hours) * 60 + Number(minutes);

  if (totalMinutes >= 1410 || totalMinutes < 300) {
    return {
      label: '深夜模式',
      transitPenalty: 18,
      environmentPenalty: 8,
      lastTrainPressure: '捷運多數停駛，需拉高地面移動與求助點權重。',
    };
  }

  if (totalMinutes >= 1350) {
    return {
      label: '末班車警戒',
      transitPenalty: 10,
      environmentPenalty: 4,
      lastTrainPressure: '接近末班車，轉乘失敗風險升高。',
    };
  }

  if (totalMinutes >= 1080) {
    return {
      label: '夜間主時段',
      transitPenalty: 4,
      environmentPenalty: 2,
      lastTrainPressure: '大眾運輸仍可用，但人流下降。',
    };
  }

  return {
    label: '一般夜間',
    transitPenalty: 1,
    environmentPenalty: 0,
    lastTrainPressure: '交通供給相對完整。',
  };
}

async function fetchYouBikeSnapshot() {
  return withCache('live:youbike', 1000 * 60 * 3, async () => {
    try {
      const stations = await fetchJson('https://tcgbusfs.blob.core.windows.net/dotapp/youbike/v2/youbike_immediate.json', {
        next: { revalidate: 180 },
      });

      return {
        isLive: true,
        lastUpdate: stations[0]?.srcUpdateTime || stations[0]?.updateTime || '剛剛',
        stations: stations.map((station) => ({
          id: `youbike-${station.sno || station.station_no || station.StationUID}`,
          layerId: 'youbike',
          sourceId: 'tpe-youbike-live',
          provider: '臺北市政府交通局',
          city: '臺北市',
          name: `${station.sna || station.station_name}`.replace(/^YouBike2\.0_/, ''),
          address: station.ar || station.address || '',
          lat: Number(station.latitude || station.lat),
          lng: Number(station.longitude || station.lng),
          availableRent: Number(station.available_rent_bikes || station.availableRentBikes || 0),
          availableReturn: Number(station.available_return_bikes || station.availableReturnBikes || 0),
          detail: `可借 ${station.available_rent_bikes || 0} / 可還 ${station.available_return_bikes || 0}`,
          updatedAt: station.srcUpdateTime || station.updateTime || '',
        })),
      };
    } catch {
      return {
        isLive: false,
        lastUpdate: '使用靜態快照',
        stations: [
          {
            id: 'fallback-youbike-main',
            layerId: 'youbike',
            sourceId: 'tpe-youbike-live',
            provider: '臺北市政府交通局',
            city: '臺北市',
            name: 'YouBike 台北車站(忠孝)',
            lat: 25.0479,
            lng: 121.5172,
            availableRent: 18,
            availableReturn: 8,
            detail: '可借 18 / 可還 8',
            updatedAt: 'fallback',
          },
          {
            id: 'fallback-youbike-cityhall',
            layerId: 'youbike',
            sourceId: 'tpe-youbike-live',
            provider: '臺北市政府交通局',
            city: '臺北市',
            name: 'YouBike 市政府站',
            lat: 25.0408,
            lng: 121.5673,
            availableRent: 9,
            availableReturn: 11,
            detail: '可借 9 / 可還 11',
            updatedAt: 'fallback',
          },
          {
            id: 'fallback-youbike-banqiao',
            layerId: 'youbike',
            sourceId: 'ntpc-youbike-live',
            provider: '新北市政府交通局',
            city: '新北市',
            name: 'YouBike 板橋車站',
            lat: 25.0141,
            lng: 121.4636,
            availableRent: 7,
            availableReturn: 12,
            detail: '可借 7 / 可還 12',
            updatedAt: 'fallback',
          },
        ],
      };
    }
  });
}

async function fetchWeatherSnapshot() {
  return withCache('live:weather', 1000 * 60 * 10, async () => {
    const apiKey = process.env.CWA_API_KEY || process.env.NEXT_PUBLIC_CWA_API_KEY;
    if (!apiKey) {
      return WEATHER_FALLBACK;
    }

    try {
      const url = new URL('https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001');
      url.searchParams.set('Authorization', apiKey);
      url.searchParams.set('locationName', '臺北市,新北市');
      url.searchParams.set('elementName', 'PoP,MinT,MaxT,Wx');

      const data = await fetchJson(url.toString(), { next: { revalidate: 600 } });
      const location = data.records?.location?.[0];
      const pop = Number(location?.weatherElement?.find((item) => item.elementName === 'PoP')?.time?.[0]?.parameter?.parameterName || 20);
      const weatherSummary = location?.weatherElement?.find((item) => item.elementName === 'Wx')?.time?.[0]?.parameter?.parameterName || '夜間多雲';
      const tempMin = Number(location?.weatherElement?.find((item) => item.elementName === 'MinT')?.time?.[0]?.parameter?.parameterName || 22);
      const tempMax = Number(location?.weatherElement?.find((item) => item.elementName === 'MaxT')?.time?.[0]?.parameter?.parameterName || 27);

      return {
        location: '臺北市 / 新北市',
        rainProbability: pop,
        summary: weatherSummary,
        temperature: Math.round((tempMin + tempMax) / 2),
      };
    } catch {
      return WEATHER_FALLBACK;
    }
  });
}

async function fetchAqiSnapshot() {
  return withCache('live:aqi', 1000 * 60 * 10, async () => {
    const apiKey = process.env.MOENV_API_KEY || process.env.AQI_API_KEY;
    if (!apiKey) {
      return AQI_FALLBACK;
    }

    try {
      const url = new URL('https://data.moenv.gov.tw/api/v2/aqx_p_432');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('limit', '20');
      url.searchParams.set('format', 'json');

      const data = await fetchJson(url.toString(), { next: { revalidate: 600 } });
      const relevant = (data.records || []).filter((item) => ['中山', '古亭', '板橋', '新店', '土城', '新莊', '萬華'].includes(item.sitename));
      const average = relevant.length
        ? Math.round(relevant.reduce((sum, item) => sum + Number(item.aqi || 0), 0) / relevant.length)
        : AQI_FALLBACK.aqi;

      return {
        location: '雙北測站平均',
        aqi: average,
        status: average <= 50 ? '普通' : average <= 100 ? '對敏感族群不佳' : '不佳',
        summary: `取 ${relevant.length || 0} 個雙北測站平均。`,
      };
    } catch {
      return AQI_FALLBACK;
    }
  });
}

async function getEnvironmentSignals() {
  const [weather, aqi] = await Promise.all([fetchWeatherSnapshot(), fetchAqiSnapshot()]);
  return { weather, aqi };
}

function parseBBox(rawBbox) {
  if (!rawBbox) {
    return null;
  }

  const values = rawBbox.split(',').map(Number);
  if (values.length !== 4 || values.some(Number.isNaN)) {
    return null;
  }

  return {
    minLat: Math.min(values[0], values[2]),
    minLng: Math.min(values[1], values[3]),
    maxLat: Math.max(values[0], values[2]),
    maxLng: Math.max(values[1], values[3]),
  };
}

export async function getMapLayers({ bbox, layers }) {
  const parsedBounds = typeof bbox === 'string' ? parseBBox(bbox) : bbox;
  const layerSet = new Set(Array.isArray(layers) ? layers : `${layers || ''}`.split(',').filter(Boolean));

  return withCache(`layers:${JSON.stringify(parsedBounds)}:${[...layerSet].sort().join(',')}`, LAYERS_TTL, async () => {
    const youbike = await fetchYouBikeSnapshot();
    const allFeatures = [
      ...officialSnapshotFeatures,
      ...youbike.stations,
    ];

    const filtered = allFeatures.filter((feature) => {
      if (layerSet.size && !layerSet.has(feature.layerId)) {
        return false;
      }
      return isPointInBounds(feature, parsedBounds);
    });

    const featuresByLayer = filtered.reduce((grouped, feature) => {
      grouped[feature.layerId] ||= [];
      grouped[feature.layerId].push(feature);
      return grouped;
    }, {});

    return {
      featuresByLayer,
      freshness: {
        youbike: youbike.lastUpdate,
      },
      sourceTrail: publicDataCatalog.filter((source) => layerSet.size === 0 || layerSet.has(source.layerId)),
    };
  });
}

export async function getNearbyResources({ lat, lng, radiusMeters = 600 }) {
  const point = { lat: Number(lat), lng: Number(lng) };
  const youbike = await fetchYouBikeSnapshot();
  const allFeatures = [...officialSnapshotFeatures, ...youbike.stations];

  return allFeatures
    .map((feature) => ({
      ...feature,
      distanceMeters: Math.round(haversineDistanceMeters(point, feature)),
    }))
    .filter((feature) => feature.distanceMeters <= radiusMeters)
    .sort((left, right) => left.distanceMeters - right.distanceMeters)
    .slice(0, 15);
}

function normalizeLayerCounts(features) {
  const counts = {};
  for (const feature of features) {
    counts[feature.layerId] = (counts[feature.layerId] || 0) + 1;
  }
  return counts;
}

function buildSegmentInsights(coordinates, nearbyFeatures, timeProfile, environmentSignals) {
  const segments = [];
  const samplePoints = sampleAlongCoordinates(coordinates, 180);

  for (let index = 0; index < samplePoints.length - 1; index += 1) {
    const start = samplePoints[index];
    const end = samplePoints[index + 1];
    const midpoint = {
      lat: (start.lat + end.lat) / 2,
      lng: (start.lng + end.lng) / 2,
    };
    const segmentFeatures = nearbyFeatures.filter((feature) => haversineDistanceMeters(midpoint, feature) <= 250);
    const counts = normalizeLayerCounts(segmentFeatures);
    let score = 55;
    const reasons = [];

    if ((counts.streetlight || 0) > 0) {
      score += 12;
      reasons.push('照明帶覆蓋較完整');
    }
    if ((counts.police || 0) + (counts.cctv || 0) >= 2) {
      score += 8;
      reasons.push('警政 / CCTV 可視性較高');
    }
    if ((counts.roadwork || 0) > 0) {
      score -= 15;
      reasons.push('附近有施工點，步行連續性下降');
    }
    if ((counts.incident || 0) > 0) {
      score -= 6;
      reasons.push('附近有歷史案件訊號，只作弱警示');
    }
    if (environmentSignals.weather.rainProbability >= 50) {
      score -= 6;
      reasons.push('降雨機率高，夜間視距與停留舒適度下降');
    }
    if (environmentSignals.aqi.aqi >= 80) {
      score -= 4;
      reasons.push('空氣品質偏差，長距離步行不利');
    }
    if (timeProfile.transitPenalty >= 10) {
      score -= 4;
      reasons.push('接近深夜，地面段風險權重提高');
    }

    if (!reasons.length) {
      reasons.push('這段沒有明顯加扣分資料，以一般夜間條件估算');
    }

    segments.push({
      id: `segment-${index + 1}`,
      coordinates: encodeLeafletCoordinates([start, end]),
      score: clamp(Math.round(score)),
      label: score >= 75 ? '友善段' : score >= 55 ? '中性段' : '注意段',
      reasons,
      nearbyCount: segmentFeatures.length,
    });
  }

  return segments;
}

function scoreRoute({ mode, routeData, nearbyFeatures, plan, environmentSignals, timeProfile }) {
  const counts = normalizeLayerCounts(nearbyFeatures);
  const distanceKm = routeData.distanceMeters / 1000;
  const durationMinutes = routeData.durationMinutes;
  const walkingExposureBase = mode === 'taxi' ? 18 : mode === 'bike' ? 36 : 62;

  const lightingScore = clamp(48 + (counts.streetlight || 0) * 7 + (counts.cctv || 0) * 2);
  const anchorScore = clamp(38 + (counts.police || 0) * 8 + (counts.cctv || 0) * 5 + (counts.medical || 0) * 5 + (counts.restroom || 0) * 3);
  const transitContinuityScore = clamp(
    mode === 'taxi'
      ? 72 - timeProfile.transitPenalty / 2
      : mode === 'bike'
        ? 68 + (counts.youbike || 0) * 10 - Math.max(0, timeProfile.transitPenalty - 6)
        : 58 + (counts.metro || 0) * 8 + (counts.youbike || 0) * 4 - timeProfile.transitPenalty,
  );
  const walkingExposureScore = clamp(100 - walkingExposureBase - Math.round(durationMinutes * (mode === 'walk' ? 0.9 : 0.45)));
  const disruptionRiskScore = clamp(78 - (counts.roadwork || 0) * 14 - (counts.incident || 0) * 5);
  const environmentScore = clamp(
    84
      - Math.round(environmentSignals.weather.rainProbability * 0.25)
      - Math.max(0, environmentSignals.aqi.aqi - 40) * 0.3,
  );

  const overall = clamp(Math.round(
    (lightingScore * 0.25)
      + (anchorScore * 0.15)
      + (transitContinuityScore * 0.2)
      + (walkingExposureScore * 0.2)
      + (disruptionRiskScore * 0.1)
      + (environmentScore * 0.1),
  ));

  const segments = buildSegmentInsights(
    routeData.geometry.map(([lat, lng]) => ({ lat, lng })),
    nearbyFeatures,
    timeProfile,
    environmentSignals,
  );

  const warnings = [];
  if ((counts.roadwork || 0) > 0) warnings.push('沿線有施工點，現場動線可能臨時調整。');
  if ((counts.incident || 0) > 0) warnings.push('沿線附近出現歷史案件訊號，請避免停留與低照度巷弄。');
  if (environmentSignals.weather.rainProbability >= 50) warnings.push('今晚降雨機率偏高，建議以主幹道與有遮蔽轉乘點為主。');
  if (mode === 'bike' && (counts.youbike || 0) === 0) warnings.push('起訖點附近可用 YouBike 少，現場供給需再確認。');

  const dataEvidence = [
    `照明 / CCTV / 求助點共覆蓋 ${nearbyFeatures.length} 個沿線資料點`,
    `${timeProfile.label}：${timeProfile.lastTrainPressure}`,
    `環境修正：降雨 ${environmentSignals.weather.rainProbability}% / AQI ${environmentSignals.aqi.aqi}`,
  ];

  const narrative = mode === 'taxi'
    ? '這條路把暴露時間壓到最低，適合接近深夜或你想把不確定性壓低時。'
    : mode === 'bike'
      ? '這條路的成本最低，但需要依賴 YouBike 或自行車供給，對天氣與道路狀況較敏感。'
      : '這條路會讓你經過更多照明帶與安心錨點，但總移動時間會拉長。';

  return {
    label: mode === 'taxi' ? '最快方案' : mode === 'bike' ? '低成本備援' : '夜間友善',
    tag: mode === 'taxi' ? 'fastest' : mode === 'bike' ? 'budget' : 'night-friendly',
    tagColor: mode === 'taxi' ? 'cyan' : mode === 'bike' ? 'amber' : 'green',
    mode,
    summary: MODE_LABELS[mode],
    totalTime: durationMinutes,
    totalCost: mode === 'taxi' ? Math.max(165, Math.round(85 + distanceKm * 32)) : mode === 'bike' ? 15 : 0,
    walkingMinutes: mode === 'taxi' ? 3 : mode === 'bike' ? 5 : durationMinutes,
    distanceMeters: routeData.distanceMeters,
    scores: {
      overall,
      lighting: lightingScore,
      anchors: anchorScore,
      transitReliability: transitContinuityScore,
      walkingExposure: walkingExposureScore,
      disruptionRisk: disruptionRiskScore,
      environmentAdjustment: environmentScore,
    },
    geometry: routeData.geometry,
    segmentInsights: segments,
    dataEvidence,
    warnings,
    nearbyFeatureCount: nearbyFeatures.length,
    aiExplanation: narrative,
    transferCount: mode === 'walk' ? 1 : mode === 'bike' ? 2 : 0,
    source: routeData.source,
  };
}

function pickSafeWaypoint(from, to) {
  const midpoint = { lat: (from.lat + to.lat) / 2, lng: (from.lng + to.lng) / 2 };
  const candidates = officialSnapshotFeatures.filter((feature) =>
    ['police', 'cctv', 'metro', 'streetlight', 'restroom'].includes(feature.layerId),
  );

  const nearest = findNearestFeature(midpoint, candidates);
  return nearest?.feature || null;
}

async function buildRouteCandidates(from, to) {
  const waypoint = pickSafeWaypoint(from, to);
  const walkingCoordinates = waypoint ? [from, waypoint, to] : [from, to];

  const [walkRoute, bikeRoute, taxiRoute] = await Promise.all([
    fetchOsrmRoute('foot', walkingCoordinates),
    fetchOsrmRoute('bike', [from, to]),
    fetchOsrmRoute('driving', [from, to]),
  ]);

  return [
    { mode: 'taxi', routeData: taxiRoute },
    { mode: 'walk', routeData: walkRoute },
    { mode: 'bike', routeData: bikeRoute },
  ];
}

async function buildNearbyFeaturesForRoute(routeData) {
  const bounds = expandBoundingBox(computeBoundingBox(routeData.geometry.map(([lat, lng]) => ({ lat, lng }))), 0.008);
  const layerData = await getMapLayers({ bbox: bounds, layers: [] });
  return Object.values(layerData.featuresByLayer).flat();
}

function buildSummary(plan, recommended, environmentSignals, geocoded) {
  const timeProfile = getTimeProfile(plan.time);

  return {
    overview: `NightSafe 已把 ${geocoded.from.city} 到 ${geocoded.to.city} 的真實座標、地圖路徑、雙北公開資料與夜間環境訊號整合成可解釋的候選方案。`,
    decisionReason: `目前綜合分數最高的是「${recommended.label}」，因為它在照明、安心錨點、步行暴露與中斷風險之間最平衡。${timeProfile.lastTrainPressure}`,
    checklist: [
      '出發前先確認手機電量、行動網路與緊急聯絡方式。',
      '如果沿線臨時封閉或光線不如預期，優先切回主要道路與可求助點。',
      '深夜時段請避免為了省時而進入長巷或視距差的捷徑。',
    ],
    environment: environmentSignals,
    riskSummary: [
      `今晚降雨機率 ${environmentSignals.weather.rainProbability}%`,
      `雙北 AQI 約 ${environmentSignals.aqi.aqi}（${environmentSignals.aqi.status}）`,
      `系統目前納入 ${publicDataSummary.sourceCount} 個資料來源與沿線即時 YouBike 快照`,
    ],
  };
}

async function buildAiNarrative(summary, routes) {
  const apiKey = process.env.NIGHTSAFE_AI_API_KEY || process.env.OPENAI_API_KEY;
  const baseUrl = process.env.NIGHTSAFE_AI_BASE_URL || process.env.OPENAI_BASE_URL || 'https://free.v36.cm/v1';
  const model = process.env.NIGHTSAFE_AI_MODEL || 'gpt-4o-mini';

  if (!apiKey || apiKey === 'your-api-key-here') {
    return {
      overview: summary.overview,
      decisionReason: summary.decisionReason,
      routeNotes: Object.fromEntries(routes.map((route) => [route.tag, route.aiExplanation])),
      checklist: summary.checklist,
      isFallback: true,
    };
  }

  const body = {
    summary,
    routes: routes.map((route) => ({
      label: route.label,
      score: route.scores.overall,
      evidence: route.dataEvidence,
      warnings: route.warnings,
    })),
  };

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: 800,
        messages: [
          {
            role: 'system',
            content: '你是 NightSafe 的路線說明層。只輸出 JSON：{"overview":"","decision_reason":"","route_notes":{"fastest":"","night-friendly":"","budget":""},"checklist":["","",""]}',
          },
          {
            role: 'user',
            content: JSON.stringify(body),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error('AI response failed');
    }

    const payload = await response.json();
    const parsed = safeJsonParse(payload.choices?.[0]?.message?.content || '');

    if (!parsed) {
      throw new Error('AI response parse failed');
    }

    return {
      overview: parsed.overview || summary.overview,
      decisionReason: parsed.decision_reason || summary.decisionReason,
      routeNotes: parsed.route_notes || {},
      checklist: Array.isArray(parsed.checklist) && parsed.checklist.length ? parsed.checklist : summary.checklist,
      isFallback: false,
    };
  } catch {
    return {
      overview: summary.overview,
      decisionReason: summary.decisionReason,
      routeNotes: Object.fromEntries(routes.map((route) => [route.tag, route.aiExplanation])),
      checklist: summary.checklist,
      isFallback: true,
    };
  }
}

export async function planNightRoute(input = {}) {
  const plan = normalizePlannerInput(input);
  const planId = buildPlanId(plan);
  const cacheKey = `plan:${planId}`;
  const cached = getCachedValue(cacheKey);

  if (cached) {
    return cached;
  }

  const [fromPlace, toPlace] = await Promise.all([geocodePlace(plan.from), geocodePlace(plan.to)]);
  if (!fromPlace || !toPlace) {
    throw new Error('Unable to geocode plan');
  }

  const timeProfile = getTimeProfile(plan.time);
  const environmentSignals = await getEnvironmentSignals();
  const candidates = await buildRouteCandidates(fromPlace, toPlace);

  const scoredRoutes = [];

  for (const candidate of candidates) {
    const nearbyFeatures = await buildNearbyFeaturesForRoute(candidate.routeData);
    scoredRoutes.push(scoreRoute({
      mode: candidate.mode,
      routeData: candidate.routeData,
      nearbyFeatures,
      environmentSignals,
      timeProfile,
      plan,
    }));
  }

  const sortedRoutes = scoredRoutes.sort((left, right) => right.scores.overall - left.scores.overall);
  const summary = buildSummary(plan, sortedRoutes[0], environmentSignals, { from: fromPlace, to: toPlace });
  const narrative = await buildAiNarrative(summary, sortedRoutes);

  const routes = sortedRoutes.map((route) => ({
    ...route,
    id: `route-${route.tag}`,
    nightScore: route.scores.overall,
    lightingScore: route.scores.lighting,
    safetyAnchorScore: route.scores.anchors,
    transitScore: route.scores.transitReliability,
    mainRoadScore: clamp(Math.round((route.scores.lighting + route.scores.anchors) / 2)),
    walkingPenalty: clamp(100 - route.scores.walkingExposure),
    aiExplanation: narrative.routeNotes?.[route.tag] || route.aiExplanation,
    mainRoadPercent: clamp(Math.round((route.scores.lighting + route.scores.disruptionRisk) / 2)),
  }));

  const result = {
    planId,
    plan,
    geocoded: {
      from: fromPlace,
      to: toPlace,
    },
    summary: {
      ...summary,
      overview: narrative.overview,
      decisionReason: narrative.decisionReason,
      checklist: narrative.checklist,
    },
    routes,
    recommendedRouteId: routes[0]?.id,
    fallbacks: routes.slice(1).map((route) => ({
      id: route.id,
      label: route.label,
      reason: route.aiExplanation,
    })),
    sourceTrail: publicDataCatalog.slice(0, 12),
    liveSignals: {
      youbike: await fetchYouBikeSnapshot(),
      weather: environmentSignals.weather,
      aqi: environmentSignals.aqi,
      timeProfile,
    },
  };

  return withCache(cacheKey, PLAN_TTL, async () => result);
}

export async function getRoutesByPlanId(planId) {
  const cached = getCachedValue(`plan:${planId}`);
  if (!cached) {
    return null;
  }

  return {
    planId: cached.planId,
    recommendedRouteId: cached.recommendedRouteId,
    routes: cached.routes.map((route) => ({
      id: route.id,
      tag: route.tag,
      label: route.label,
      summary: route.summary,
      totalTime: route.totalTime,
      totalCost: route.totalCost,
      geometry: route.geometry,
      segmentInsights: route.segmentInsights,
      score: route.scores.overall,
      warnings: route.warnings,
    })),
  };
}
