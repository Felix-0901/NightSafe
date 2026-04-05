const DEFAULT_PLAN = {
  from: '台北車站',
  to: '永春站',
  time: '21:30',
  prefs: ['bright-route', 'main-road'],
};

const MODE_LABELS = {
  taxi: '計程車',
  walk: '步行',
  bike: 'YouBike / 自行車',
};

export function parsePlannerInput(searchParams = {}) {
  const from = readSearchValue(searchParams, 'from');
  const to = readSearchValue(searchParams, 'to');
  const time = readSearchValue(searchParams, 'time');
  const rawPrefs = readSearchValue(searchParams, 'prefs');
  const planId = readSearchValue(searchParams, 'planId');

  return {
    from: from || DEFAULT_PLAN.from,
    to: to || DEFAULT_PLAN.to,
    time: time || DEFAULT_PLAN.time,
    prefs: rawPrefs
      ? rawPrefs.split(',').map((item) => item.trim()).filter(Boolean)
      : DEFAULT_PLAN.prefs,
    planId: planId || '',
  };
}

function readSearchValue(searchParams, key) {
  if (searchParams && typeof searchParams.get === 'function') {
    return searchParams.get(key);
  }

  return searchParams?.[key];
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

export function getModeLabel(mode) {
  return MODE_LABELS[mode] || mode;
}
