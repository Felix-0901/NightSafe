export function toRadians(value) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(from, to) {
  const earthRadius = 6371000;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function decodePolylineCoordinates(coordinates = []) {
  return coordinates.map(([lng, lat]) => ({ lat, lng }));
}

export function encodeLeafletCoordinates(coordinates = []) {
  return coordinates.map(({ lat, lng }) => [lat, lng]);
}

export function computeBoundingBox(coordinates = []) {
  if (!coordinates.length) {
    return null;
  }

  const bounds = coordinates.reduce((acc, point) => ({
    minLat: Math.min(acc.minLat, point.lat),
    maxLat: Math.max(acc.maxLat, point.lat),
    minLng: Math.min(acc.minLng, point.lng),
    maxLng: Math.max(acc.maxLng, point.lng),
  }), {
    minLat: coordinates[0].lat,
    maxLat: coordinates[0].lat,
    minLng: coordinates[0].lng,
    maxLng: coordinates[0].lng,
  });

  return bounds;
}

export function expandBoundingBox(bounds, padding = 0.01) {
  if (!bounds) {
    return null;
  }

  return {
    minLat: bounds.minLat - padding,
    maxLat: bounds.maxLat + padding,
    minLng: bounds.minLng - padding,
    maxLng: bounds.maxLng + padding,
  };
}

export function isPointInBounds(point, bounds) {
  if (!bounds) {
    return true;
  }

  return point.lat >= bounds.minLat
    && point.lat <= bounds.maxLat
    && point.lng >= bounds.minLng
    && point.lng <= bounds.maxLng;
}

export function interpolatePoint(start, end, ratio) {
  return {
    lat: start.lat + ((end.lat - start.lat) * ratio),
    lng: start.lng + ((end.lng - start.lng) * ratio),
  };
}

export function sampleAlongCoordinates(coordinates, stepMeters = 220) {
  if (coordinates.length <= 2) {
    return coordinates;
  }

  const sampled = [coordinates[0]];

  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1];
    const current = coordinates[index];
    const segmentDistance = haversineDistanceMeters(previous, current);

    if (segmentDistance <= stepMeters) {
      sampled.push(current);
      continue;
    }

    const steps = Math.ceil(segmentDistance / stepMeters);

    for (let step = 1; step <= steps; step += 1) {
      sampled.push(interpolatePoint(previous, current, step / steps));
    }
  }

  return sampled;
}

export function findNearestFeature(point, features = []) {
  let nearest = null;
  let distance = Number.POSITIVE_INFINITY;

  for (const feature of features) {
    const featureDistance = haversineDistanceMeters(point, feature);
    if (featureDistance < distance) {
      distance = featureDistance;
      nearest = feature;
    }
  }

  return nearest ? { feature: nearest, distance } : null;
}

