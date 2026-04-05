import Link from 'next/link';
import {
  AlertTriangle, ArrowLeft, Bookmark, CheckCircle, Info, Map, Share2, Shield, Sparkles,
} from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import NightScore from '@/components/NightScore/NightScore';
import { serializePlannerState } from '@/lib/nightSafeEngine';
import { planNightRoute } from '@/lib/server/nightsafePlanner';
import styles from '../pages.module.css';

export const dynamic = 'force-dynamic';

function buildRouteSteps(route, plan) {
  if (route.mode === 'taxi') {
    return [
      {
        title: '起點上車',
        detail: `在 ${plan.from} 主幹道側上車，縮短等待暴露。`,
      },
      {
        title: '主要道路直達',
        detail: '系統偏好可視性高、轉向少的地面路徑。',
      },
      {
        title: '亮口下車',
        detail: `於 ${plan.to} 周邊明亮路口下車，再保留最短步行。`,
      },
    ];
  }

  if (route.mode === 'bike') {
    return [
      {
        title: '起點站點確認',
        detail: `先確認 ${plan.from} 周邊 YouBike 供給與可還車空位。`,
      },
      {
        title: '騎乘主線',
        detail: '以主要道路與照明帶為主，盡量避開暗巷與施工點。',
      },
      {
        title: '目的地短步行',
        detail: `於 ${plan.to} 周邊站點還車後，保留短步行收尾。`,
      },
    ];
  }

  return [
    {
      title: '安全走廊起步',
      detail: `從 ${plan.from} 出發後，優先沿照明與 CCTV 覆蓋較高路段前進。`,
    },
    {
      title: '沿線校正',
      detail: '中段盡量靠近求助點、捷運出口與公廁等可停留節點。',
    },
    {
      title: '目的地收尾',
      detail: `接近 ${plan.to} 時，避免為了省幾分鐘進入視距差的巷弄。`,
    },
  ];
}

export default async function DetailPage({ searchParams }) {
  const resolvedSearchParams = await searchParams;
  const analysis = await planNightRoute(resolvedSearchParams || {});
  const routeId = resolvedSearchParams?.route || analysis.recommendedRouteId;
  const route = analysis.routes.find((item) => item.id === routeId || item.tag === routeId) || analysis.routes[0];
  const resultsHref = `/results?${serializePlannerState(analysis.plan, { planId: analysis.planId })}`;
  const mapHref = `/map?${serializePlannerState(analysis.plan, { planId: analysis.planId, route: route.id })}`;
  const routeSteps = buildRouteSteps(route, analysis.plan);

  return (
    <>
      <Navbar />

      <div className={`container ${styles.pageContainer}`}>
        <div style={{ marginBottom: 'var(--space-xl)' }}>
          <Link href={resultsHref} className="btn btn-ghost btn-sm" style={{ marginBottom: 'var(--space-md)' }}>
            <ArrowLeft size={16} />
            返回結果
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
            <div>
              <h1 style={{ fontSize: 'var(--text-2xl)', fontWeight: 800, marginBottom: 4 }}>
                {route.label}
              </h1>
              <p style={{ color: 'var(--color-text-muted)' }}>
                {analysis.geocoded.from.name} → {analysis.geocoded.to.name}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn-secondary btn-sm">
                <Bookmark size={16} />
                收藏
              </button>
              <button className="btn btn-primary btn-sm">
                <Share2 size={16} />
                分享
              </button>
            </div>
          </div>
        </div>

        <div className={styles.detailGrid}>
          <div>
            <div style={{
              background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(6, 182, 212, 0.12))',
              border: '1px solid rgba(34, 197, 94, 0.2)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-xl)',
              marginBottom: 'var(--space-xl)',
            }}>
              <h3 style={{ marginBottom: 'var(--space-sm)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Sparkles size={20} style={{ color: 'var(--color-cta)' }} />
                方案摘要
              </h3>
              <p style={{ color: 'var(--color-text-muted)', lineHeight: 1.8 }}>
                {route.aiExplanation}
              </p>
            </div>

            <h3 style={{ marginBottom: 'var(--space-lg)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <Sparkles size={20} style={{ color: 'var(--color-cta)' }} />
              實際執行步驟
            </h3>

            <div className={styles.timeline}>
              {routeSteps.map((step, index) => (
                <div key={`${route.id}-${step.title}`} className={styles.timelineItem}>
                  <div className={styles.timelineLine}>
                    <div className={styles.timelineDot} style={{ borderColor: 'var(--color-cta)' }} />
                    {index < routeSteps.length - 1 && <div className={styles.timelineConnector} />}
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.stepCard}>
                      <div className={styles.stepHeader}>
                        <div className={styles.stepMode} style={{ color: 'var(--color-cta)' }}>
                          <span>{step.title}</span>
                        </div>
                      </div>
                      <p className={styles.stepDetail}>{step.detail}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-xl)',
              padding: 'var(--space-xl)',
              marginTop: 'var(--space-xl)',
            }}>
              <h3 style={{ marginBottom: 'var(--space-md)', display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                <Info size={20} style={{ color: 'var(--color-cyan)' }} />
                分段判讀
              </h3>
              <div className={styles.routeEvidence}>
                {route.segmentInsights.map((segment) => (
                  <div key={segment.id} className={styles.routeEvidenceItem}>
                    {segment.label} · {segment.score} 分 · {segment.reasons.join('、')}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.detailSidebar}>
            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <Shield size={18} style={{ color: 'var(--color-cta)' }} />
                NightSafe Score
              </h4>
              <NightScore
                score={route.nightScore}
                lightingScore={route.lightingScore}
                safetyAnchorScore={route.safetyAnchorScore}
                transitScore={route.transitScore}
                mainRoadScore={route.mainRoadScore}
                walkingPenalty={route.walkingPenalty}
              />
            </div>

            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <CheckCircle size={18} style={{ color: 'var(--color-cta)' }} />
                資料證據
              </h4>
              <div className={styles.routeEvidence}>
                {route.dataEvidence.map((item) => (
                  <div key={item} className={styles.routeEvidenceItem}>{item}</div>
                ))}
              </div>
            </div>

            <div className={styles.sidebarCard}>
              <h4 className={styles.sidebarTitle}>
                <CheckCircle size={18} style={{ color: 'var(--color-cta)' }} />
                行前提醒
              </h4>
              <div className={styles.reminderList}>
                {analysis.summary.checklist.map((item) => (
                  <div key={item} className={styles.reminder}>
                    <span className={styles.reminderIcon} style={{ color: 'var(--color-cyan)' }}><CheckCircle size={16} /></span>
                    <span>{item}</span>
                  </div>
                ))}
                {route.warnings.map((warning) => (
                  <div key={warning} className={styles.reminder}>
                    <span className={styles.reminderIcon} style={{ color: 'var(--color-rose)' }}><AlertTriangle size={16} /></span>
                    <span>{warning}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link href={mapHref} className="btn btn-secondary" style={{ width: '100%' }}>
              <Map size={18} />
              在地圖上查看
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
