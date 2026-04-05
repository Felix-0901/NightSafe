'use client';

import { Suspense, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import MapView from '@/components/MapView/MapView';
import { parsePlannerInput, serializePlannerState } from '@/lib/nightSafeEngine';
import styles from '../pages.module.css';

const routeOptions = [
  { id: null, label: '推薦', color: 'var(--color-text)' },
  { id: 'route-fastest', label: '最快', color: 'var(--color-cyan)' },
  { id: 'route-night-friendly', label: '夜間友善', color: 'var(--color-cta)' },
  { id: 'route-budget', label: '低成本', color: 'var(--color-amber)' },
];

function MapContent() {
  const searchParams = useSearchParams();
  const initialRoute = searchParams.get('route');
  const [activeRoute, setActiveRoute] = useState(initialRoute || null);
  const plan = parsePlannerInput(searchParams);
  const planId = searchParams.get('planId') || '';

  const resultsHref = useMemo(() => `/results?${serializePlannerState(plan, { planId })}`, [plan, planId]);

  return (
    <>
      <div className={styles.mapToolbar}>
        <div className={styles.mapToolbarLeft}>
          <Link href={resultsHref} className="btn btn-ghost btn-sm">
            <ArrowLeft size={16} />
            返回結果
          </Link>
          <div className={styles.routeFilter}>
            {routeOptions.map((option) => (
              <button
                key={option.id || 'recommended'}
                className={`${styles.routeFilterBtn} ${activeRoute === option.id ? styles.active : ''}`}
                style={activeRoute === option.id ? { background: `${option.color}20`, color: option.color, borderColor: 'transparent' } : {}}
                onClick={() => setActiveRoute(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.mapContent}>
        <MapView plan={plan} planId={planId} activeRoute={activeRoute} />
      </div>
    </>
  );
}

export default function MapPage() {
  return (
    <div className={styles.mapPageContainer}>
      <Navbar />
      <Suspense fallback={<div className={styles.mapContent} />}>
        <MapContent />
      </Suspense>
    </div>
  );
}
