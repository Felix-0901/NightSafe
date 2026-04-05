import Link from 'next/link';
import { ArrowRight, CloudRain, Map, Shield, Sparkles, Wind } from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import RouteCard from '@/components/RouteCard/RouteCard';
import { serializePlannerState } from '@/lib/nightSafeEngine';
import { planNightRoute } from '@/lib/server/nightsafePlanner';
import styles from '../pages.module.css';

export const dynamic = 'force-dynamic';

export default async function ResultsPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const analysis = await planNightRoute(resolvedSearchParams || {});
  const mapHref = `/map?${serializePlannerState(analysis.plan, { planId: analysis.planId })}`;

  return (
    <>
      <Navbar />

      <div className={`container ${styles.pageContainer}`}>
        <div className={styles.pageHeader}>
          <div className={styles.pageTag} style={{ background: 'var(--color-green-soft)', color: 'var(--color-cta)' }}>
            <Sparkles size={14} />
            NightSafe v2 決策結果
          </div>
          <h1 className={styles.pageTitle}>雙北夜間安全路徑決策</h1>
          <p className={styles.pageDesc}>
            這一版不只展示資料，而是把真實地理編碼、OSRM 路線、雙北官方資料與環境訊號一起納入評分。
          </p>
        </div>

        <div className={styles.resultsHeader}>
          <div className={styles.routeInfo}>
            <span className={styles.routeInfoFrom}>{analysis.plan.from}</span>
            <ArrowRight size={20} className={styles.routeInfoArrow} style={{ color: 'var(--color-cta)' }} />
            <span className={styles.routeInfoTo}>{analysis.plan.to}</span>
            <span className={styles.routeInfoTime}>· {analysis.plan.time}</span>
          </div>
          <Link href={mapHref} className="btn btn-secondary btn-sm">
            <Map size={16} />
            地圖決策視圖
          </Link>
        </div>

        <section className={styles.analysisSummary}>
          <div className={styles.analysisSummaryTitle}>
            <Shield size={18} style={{ color: 'var(--color-cta)' }} />
            核心判讀
          </div>
          <p className={styles.analysisSummaryDesc}>{analysis.summary.overview}</p>
          <p className={styles.analysisSummaryDesc} style={{ marginTop: '12px' }}>
            {analysis.summary.decisionReason}
          </p>

          <div className={styles.analysisChecklist}>
            {analysis.summary.checklist.map((item) => (
              <div key={item} className={styles.analysisChecklistItem}>{item}</div>
            ))}
          </div>
        </section>

        <section className={styles.signalGrid}>
          <div className={styles.signalCard}>
            <div className={styles.signalTitle}>天氣修正</div>
            <div className={styles.signalValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CloudRain size={16} />
              {analysis.summary.environment.weather.rainProbability}%
            </div>
            <div className={styles.signalDesc}>{analysis.summary.environment.weather.summary}</div>
          </div>
          <div className={styles.signalCard}>
            <div className={styles.signalTitle}>空品修正</div>
            <div className={styles.signalValue} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wind size={16} />
              AQI {analysis.summary.environment.aqi.aqi}
            </div>
            <div className={styles.signalDesc}>{analysis.summary.environment.aqi.status}</div>
          </div>
          <div className={styles.signalCard}>
            <div className={styles.signalTitle}>時段判讀</div>
            <div className={styles.signalValue}>{analysis.liveSignals.timeProfile.label}</div>
            <div className={styles.signalDesc}>{analysis.liveSignals.timeProfile.lastTrainPressure}</div>
          </div>
          <div className={styles.signalCard}>
            <div className={styles.signalTitle}>YouBike 快照</div>
            <div className={styles.signalValue}>
              {analysis.liveSignals.youbike.stations.length.toLocaleString()} 站
            </div>
            <div className={styles.signalDesc}>
              {analysis.liveSignals.youbike.isLive ? `更新：${analysis.liveSignals.youbike.lastUpdate}` : '即時來源失敗，使用保守快照'}
            </div>
          </div>
        </section>

        <section className={styles.analysisChecklist} style={{ marginBottom: 'var(--space-xl)' }}>
          {analysis.summary.riskSummary.map((item) => (
            <div key={item} className={styles.analysisChecklistItem}>{item}</div>
          ))}
        </section>

        <section className={styles.sourceTrail}>
          {analysis.sourceTrail.map((source) => (
            <span key={source.id} className={styles.sourcePill}>
              {source.scope} · {source.name}
            </span>
          ))}
        </section>

        <div className={styles.resultsGrid}>
          {analysis.routes.map((route, index) => (
            <RouteCard
              key={route.id}
              route={route}
              index={index}
              recommended={route.id === analysis.recommendedRouteId}
              detailHref={`/detail?${serializePlannerState(analysis.plan, {
                planId: analysis.planId,
                route: route.id,
              })}`}
            />
          ))}
        </div>

        <div className={styles.mapToggle}>
          <Link href={mapHref} className="btn btn-primary">
            <Map size={18} />
            進入地圖決策視圖
          </Link>
        </div>
      </div>

      <Footer />
    </>
  );
}
