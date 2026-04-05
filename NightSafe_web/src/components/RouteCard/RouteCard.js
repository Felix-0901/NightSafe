'use client';

import Link from 'next/link';
import { Clock, DollarSign, Footprints, Map, Sparkles, AlertTriangle, Bookmark, ArrowRight } from 'lucide-react';
import NightScore from '../NightScore/NightScore';
import styles from './RouteCard.module.css';

export default function RouteCard({ route, index, recommended = false, detailHref }) {
  const tagColorClass = {
    green: styles.green,
    cyan: styles.cyan,
    amber: styles.amber,
  }[route.tagColor] || styles.cyan;

  return (
    <div className={`${styles.card} ${recommended ? styles.recommended : ''}`}>
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <span className={`${styles.tag} ${tagColorClass}`}>
            {route.tag === 'fastest' && '最快方案'}
            {route.tag === 'night-friendly' && '夜間友善'}
            {route.tag === 'budget' && '低成本備援'}
          </span>
          <div>
            <div className={styles.routeLabel}>方案 {String.fromCharCode(65 + index)}</div>
            <div className={styles.routeSummary}>{route.summary}</div>
          </div>
        </div>
        <NightScore
          score={route.nightScore}
          lightingScore={route.lightingScore}
          safetyAnchorScore={route.safetyAnchorScore}
          transitScore={route.transitScore}
          mainRoadScore={route.mainRoadScore}
          walkingPenalty={route.walkingPenalty}
          size="small"
          showMetrics={false}
        />
      </div>

      <div className={styles.cardBody}>
        <div className={styles.statsGrid}>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <Clock size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              預估時間
            </span>
            <span className={styles.statValue}>{route.totalTime} 分鐘</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <DollarSign size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              預估費用
            </span>
            <span className={styles.statValue}>NT${route.totalCost}</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <Footprints size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              步行
            </span>
            <span className={styles.statValue}>{route.walkingMinutes} 分鐘</span>
          </div>
          <div className={styles.stat}>
            <span className={styles.statLabel}>
              <Map size={12} style={{ display: 'inline', marginRight: 4, verticalAlign: 'middle' }} />
              主要道路
            </span>
            <span className={styles.statValue}>{route.mainRoadPercent}%</span>
          </div>
        </div>

        <div className={styles.aiPreview}>
          <div className={styles.aiIcon}>
            <Sparkles size={16} />
          </div>
          <p className={styles.aiText}>{route.aiExplanation}</p>
        </div>
      </div>

      <div className={styles.cardFooter}>
        <div className={styles.warnings}>
          {route.warnings.map((w, i) => (
            <div key={i} className={styles.warning}>
              <AlertTriangle size={12} />
              <span>{w}</span>
            </div>
          ))}
          {route.warnings.length === 0 && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-cta)' }}>
              無特別注意事項
            </span>
          )}
        </div>
        <div className={styles.actions}>
          <button className="btn btn-ghost btn-sm" aria-label="收藏此路線">
            <Bookmark size={16} />
          </button>
          <Link href={detailHref || `/detail?route=${route.id}`} className="btn btn-primary btn-sm">
            查看詳情
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
