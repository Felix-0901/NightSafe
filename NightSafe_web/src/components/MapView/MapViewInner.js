'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CircleMarker, MapContainer, Marker, Pane, Popup, Polyline, TileLayer, useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { layerPresentation } from '@/data/officialSafetyData';
import styles from './MapView.module.css';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const routeColors = {
  'route-fastest': '#06B6D4',
  'route-night-friendly': '#22C55E',
  'route-budget': '#F59E0B',
};

const defaultLayers = {
  police: true,
  cctv: true,
  medical: true,
  restroom: true,
  shelter: false,
  metro: true,
  youbike: true,
  incident: false,
  roadwork: true,
  streetlight: true,
};

function createIcon(color) {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      width: 18px;
      height: 18px;
      background: ${color};
      border-radius: 999px;
      border: 2px solid rgba(255,255,255,0.92);
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function scoreToColor(score) {
  if (score >= 75) return '#22C55E';
  if (score >= 55) return '#F59E0B';
  return '#F43F5E';
}

function midpointForRoute(route) {
  if (!route?.geometry?.length) {
    return { lat: 25.041, lng: 121.54 };
  }

  const middle = route.geometry[Math.floor(route.geometry.length / 2)];
  return { lat: middle[0], lng: middle[1] };
}

function BoundsWatcher({ onBoundsChange }) {
  useMapEvents({
    moveend(map) {
      onBoundsChange(map.target.getBounds());
    },
    zoomend(map) {
      onBoundsChange(map.target.getBounds());
    },
  });

  return null;
}

function buildBBoxString(bounds) {
  if (!bounds) {
    return '';
  }

  const southWest = bounds.getSouthWest();
  const northEast = bounds.getNorthEast();
  return [
    southWest.lat.toFixed(6),
    southWest.lng.toFixed(6),
    northEast.lat.toFixed(6),
    northEast.lng.toFixed(6),
  ].join(',');
}

export default function MapViewInner({ plan, planId: initialPlanId = '', activeRoute = null }) {
  const [planId, setPlanId] = useState(initialPlanId);
  const [routesPayload, setRoutesPayload] = useState(null);
  const [layersPayload, setLayersPayload] = useState({ featuresByLayer: {}, freshness: {} });
  const [selectedSegment, setSelectedSegment] = useState(null);
  const [nearby, setNearby] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [layers, setLayers] = useState(defaultLayers);
  const [currentBbox, setCurrentBbox] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function ensurePlanId() {
      if (initialPlanId) {
        setPlanId(initialPlanId);
        return;
      }

      const response = await fetch('/api/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan),
      });
      const payload = await response.json();
      if (isMounted && payload.planId) {
        setPlanId(payload.planId);
      }
    }

    ensurePlanId();

    return () => {
      isMounted = false;
    };
  }, [initialPlanId, plan]);

  useEffect(() => {
    let isMounted = true;

    async function fetchRoutes() {
      if (!planId) {
        return;
      }

      setIsLoading(true);
      setSelectedSegment(null);
      const response = await fetch(`/api/map/routes?planId=${planId}`);
      const payload = await response.json();

      if (!isMounted) {
        return;
      }

      setRoutesPayload(payload);
      const defaultRoute = payload.routes?.find((route) => route.id === activeRoute)
        || payload.routes?.find((route) => route.id === payload.recommendedRouteId)
        || payload.routes?.[0];

      if (defaultRoute) {
        const nearbyResponse = await fetch(`/api/nearby?lat=${midpointForRoute(defaultRoute).lat}&lng=${midpointForRoute(defaultRoute).lng}&radius=650`);
        const nearbyPayload = await nearbyResponse.json();
        if (isMounted) {
          setNearby(nearbyPayload.items || []);
        }
      }

      setIsLoading(false);
    }

    fetchRoutes();

    return () => {
      isMounted = false;
    };
  }, [planId, activeRoute]);

  const activeLayerKeys = useMemo(
    () => Object.entries(layers).filter(([, enabled]) => enabled).map(([key]) => key),
    [layers],
  );

  const focusedRoute = useMemo(() => {
    if (!routesPayload?.routes?.length) {
      return null;
    }

    return routesPayload.routes.find((route) => route.id === activeRoute)
      || routesPayload.routes.find((route) => route.id === routesPayload.recommendedRouteId)
      || routesPayload.routes[0];
  }, [routesPayload, activeRoute]);

  const center = useMemo(() => {
    if (focusedRoute?.geometry?.length) {
      return focusedRoute.geometry[Math.floor(focusedRoute.geometry.length / 2)];
    }

    return [25.041, 121.54];
  }, [focusedRoute]);

  async function loadLayers(bounds) {
    const bbox = buildBBoxString(bounds);
    if (!bbox) {
      return;
    }

    setCurrentBbox(bbox);
    const response = await fetch(`/api/map/layers?bbox=${bbox}&layers=${activeLayerKeys.join(',')}`);
    const payload = await response.json();
    setLayersPayload(payload);
  }

  useEffect(() => {
    if (!currentBbox) {
      return;
    }

    fetch(`/api/map/layers?bbox=${currentBbox}&layers=${activeLayerKeys.join(',')}`)
      .then((response) => response.json())
      .then((payload) => setLayersPayload(payload))
      .catch(() => null);
  }, [activeLayerKeys, currentBbox]);

  const visibleRoutes = routesPayload?.routes || [];

  return (
    <div className={styles.mapShell}>
      <div className={styles.mapContainer}>
        <MapContainer
          center={center}
          zoom={13}
          style={{ width: '100%', height: '100%', minHeight: '560px' }}
          zoomControl={false}
          whenReady={(event) => loadLayers(event.target.getBounds())}
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            className={styles.baseTiles}
          />
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution=""
            className={styles.labelTiles}
          />

          <BoundsWatcher onBoundsChange={loadLayers} />

          <Pane name="routes" style={{ zIndex: 420 }}>
            {visibleRoutes.map((route) => {
              const highlight = !activeRoute
                ? route.id === routesPayload.recommendedRouteId
                : route.id === activeRoute;
              const fallbackColor = routeColors[route.id] || '#06B6D4';

              if (!highlight) {
                return (
                  <Polyline
                    key={route.id}
                    positions={route.geometry}
                    pathOptions={{
                      color: fallbackColor,
                      weight: 4,
                      opacity: 0.35,
                      dashArray: route.id === 'route-budget' ? '8, 10' : undefined,
                    }}
                  />
                );
              }

              return route.segmentInsights.map((segment) => (
                <Polyline
                  key={`${route.id}-${segment.id}`}
                  positions={segment.coordinates}
                  eventHandlers={{ click: () => setSelectedSegment({ ...segment, routeLabel: route.label }) }}
                  pathOptions={{
                    color: scoreToColor(segment.score),
                    weight: 8,
                    opacity: 0.95,
                    lineCap: 'round',
                    lineJoin: 'round',
                    dashArray: route.id === 'route-budget' ? '10, 8' : undefined,
                  }}
                />
              ));
            })}
          </Pane>

          {focusedRoute?.geometry?.length ? (
            <>
              <CircleMarker center={focusedRoute.geometry[0]} radius={8} pathOptions={{ color: '#0F172A', fillColor: '#22C55E', fillOpacity: 1, weight: 3 }}>
                <Popup>起點：{plan.from}</Popup>
              </CircleMarker>
              <CircleMarker center={focusedRoute.geometry[focusedRoute.geometry.length - 1]} radius={8} pathOptions={{ color: '#0F172A', fillColor: '#F43F5E', fillOpacity: 1, weight: 3 }}>
                <Popup>終點：{plan.to}</Popup>
              </CircleMarker>
            </>
          ) : null}

          {Object.entries(layersPayload.featuresByLayer || {}).flatMap(([layerId, features]) =>
            features.map((feature) => (
              <Marker
                key={feature.id}
                position={[feature.lat, feature.lng]}
                icon={createIcon(layerPresentation[layerId]?.color || '#64748B')}
              >
                <Popup>
                  <div style={{ color: '#0F172A', minWidth: 180 }}>
                    <strong>{feature.name}</strong>
                    {feature.address ? <p style={{ marginTop: 4, fontSize: 12 }}>{feature.address}</p> : null}
                    <p style={{ marginTop: 4, fontSize: 12 }}>{feature.detail}</p>
                    {feature.availableRent !== undefined ? (
                      <p style={{ marginTop: 4, fontSize: 12 }}>
                        可借 {feature.availableRent} / 可還 {feature.availableReturn}
                      </p>
                    ) : null}
                  </div>
                </Popup>
              </Marker>
            )))}
        </MapContainer>

        <div className={styles.layerPanel}>
          <div className={styles.layerTitle}>圖層控制</div>
          {Object.entries(layerPresentation).map(([key, config]) => (
            <button key={key} type="button" className={styles.layerItem} onClick={() => setLayers((prev) => ({ ...prev, [key]: !prev[key] }))}>
              <div
                className={`${styles.layerCheckbox} ${layers[key] ? styles.active : ''}`}
                style={{ backgroundColor: layers[key] ? config.color : 'transparent' }}
              />
              <span className={styles.layerLabel}>{config.label}</span>
            </button>
          ))}
        </div>

        <div className={styles.legend}>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#22C55E' }} />
            <span>友善段</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#F59E0B' }} />
            <span>中性段</span>
          </div>
          <div className={styles.legendItem}>
            <div className={styles.legendDot} style={{ background: '#F43F5E' }} />
            <span>注意段</span>
          </div>
        </div>
      </div>

      <aside className={styles.sidePanel}>
        <div className={styles.sideCard}>
          <div className={styles.sideCardTitle}>地圖判讀</div>
          {isLoading ? (
            <p className={styles.sideCardBody}>正在計算路線與圖層資料...</p>
          ) : focusedRoute ? (
            <>
              <p className={styles.sideCardBody}>
                {focusedRoute.label} · {focusedRoute.totalTime} 分鐘 · NT${focusedRoute.totalCost}
              </p>
              <p className={styles.sideCardMuted}>{focusedRoute.summary}</p>
            </>
          ) : (
            <p className={styles.sideCardBody}>目前沒有可顯示的路線。</p>
          )}
        </div>

        <div className={styles.sideCard}>
          <div className={styles.sideCardTitle}>分段解釋</div>
          {selectedSegment ? (
            <>
              <p className={styles.sideCardBody}>
                {selectedSegment.routeLabel} · {selectedSegment.label} · {selectedSegment.score} 分
              </p>
              <ul className={styles.sideList}>
                {selectedSegment.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className={styles.sideCardBody}>點一下路段，就能看到這一段為什麼被加分或扣分。</p>
          )}
        </div>

        <div className={styles.sideCard}>
          <div className={styles.sideCardTitle}>附近可求助 / 停留點</div>
          {nearby.length ? (
            <ul className={styles.sideList}>
              {nearby.slice(0, 6).map((item) => (
                <li key={item.id}>
                  <strong>{item.name}</strong>
                  <span>{item.distanceMeters}m · {layerPresentation[item.layerId]?.label || item.layerId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.sideCardBody}>尚未抓到附近資源。</p>
          )}
        </div>

        <div className={styles.sideCard}>
          <div className={styles.sideCardTitle}>資料更新</div>
          <ul className={styles.sideList}>
            <li>
              <strong>YouBike</strong>
              <span>{layersPayload.freshness?.youbike || '未提供'}</span>
            </li>
            <li>
              <strong>範圍</strong>
              <span>目前視窗內即時抓取圖層</span>
            </li>
            <li>
              <strong>策略</strong>
              <span>只重抓 bbox 內資料，不重新計算整張圖</span>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
