'use client';

import { useMemo, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  MapPin, Clock, Sparkles, Navigation,
  Lightbulb, Footprints, Route, Zap, Wallet, ArrowRightLeft,
  Users, Bus, Database, Shield
} from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { preferenceOptions, getScenarioPreset } from '@/data/planningOptions';
import { publicDataCatalog } from '@/data/publicDataCatalog';
import { serializePlannerState } from '@/lib/nightSafeEngine';
import styles from '../pages.module.css';

const iconMap = {
  Lightbulb, Footprints, Route, Zap, Wallet, ArrowRightLeft, Users, Bus,
};

function PlanContent() {
  const searchParams = useSearchParams();
  const scenario = searchParams.get('scenario') || '';
  const preset = getScenarioPreset(scenario);

  const [from, setFrom] = useState(preset?.from || searchParams.get('from') || '台北車站');
  const [to, setTo] = useState(preset?.to || searchParams.get('to') || '永春站');
  const [time, setTime] = useState(preset?.time || searchParams.get('time') || '21:30');
  const [prefs, setPrefs] = useState(preset?.prefs || ['bright-route', 'main-road']);

  const href = useMemo(() => `/results?${serializePlannerState({
    from,
    to,
    time,
    prefs,
    scenario,
  })}`, [from, prefs, scenario, time, to]);

  const togglePref = (id) => {
    setPrefs((prev) =>
      prev.includes(id) ? prev.filter((pref) => pref !== id) : [...prev, id],
    );
  };

  const sourcePreview = publicDataCatalog.slice(0, 6);

  return (
    <div className={`container ${styles.pageContainer}`}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTag} style={{ background: 'var(--color-cyan-soft)', color: 'var(--color-cyan)' }}>
          <Navigation size={14} />
          路線規劃
        </div>
        <h1 className={styles.pageTitle}>設定今晚的移動條件</h1>
        <p className={styles.pageDesc}>NightSafe 會依起點、終點、出發時間與偏好，套用官方資料與即時交通摘要後再做分析</p>
      </div>

      <div className={styles.planGrid}>
        <div className={styles.planForm}>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MapPin size={16} style={{ color: 'var(--color-cta)' }} />
              起點
            </label>
            <div className={styles.inputWithIcon}>
              <span className={styles.inputIcon}><Navigation size={16} /></span>
              <input
                className="input"
                placeholder="輸入起點或目前位置"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <MapPin size={16} style={{ color: 'var(--color-rose)' }} />
              終點
            </label>
            <div className={styles.inputWithIcon}>
              <span className={styles.inputIcon}><MapPin size={16} /></span>
              <input
                className="input"
                placeholder="輸入目的地"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                style={{ paddingLeft: 42 }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Clock size={16} style={{ color: 'var(--color-amber)' }} />
              出發時間
            </label>
            <input
              type="time"
              className="input"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              <Sparkles size={16} style={{ color: 'var(--color-purple)' }} />
              偏好條件
            </label>
            <div className={styles.prefTags}>
              {preferenceOptions.map((option) => {
                const Icon = iconMap[option.icon];
                return (
                  <button
                    key={option.id}
                    type="button"
                    className={`${styles.prefTag} ${prefs.includes(option.id) ? styles.active : ''}`}
                    onClick={() => togglePref(option.id)}
                  >
                    <Icon size={14} />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className={styles.analysisNotice}>
            <div className={styles.analysisNoticeHeader}>
              <Database size={18} style={{ color: 'var(--color-cta)' }} />
              這次會一起納入的資料類型
            </div>
            <div className={styles.analysisSourceGrid}>
              {sourcePreview.map((source) => (
                <div key={source.id} className={styles.analysisSourceItem}>
                  <span className={styles.analysisSourceName}>{source.name}</span>
                  <span className={styles.analysisSourceDesc}>{source.analysisUse}</span>
                </div>
              ))}
            </div>
          </div>

          <Link href={href} className={`btn btn-primary btn-lg ${styles.submitBtn}`}>
            <Sparkles size={18} />
            取得分析結果
          </Link>
        </div>

        <div className={styles.planPreview}>
          <div className={styles.previewTitle}>
            <Shield size={18} style={{ color: 'var(--color-cta)' }} />
            分析摘要
          </div>

          <div className={styles.previewItem}>
            <span className={styles.previewItemLabel}>起點</span>
            <span className={styles.previewItemValue}>{from || '未設定'}</span>
          </div>
          <div className={styles.previewItem}>
            <span className={styles.previewItemLabel}>終點</span>
            <span className={styles.previewItemValue}>{to || '未設定'}</span>
          </div>
          <div className={styles.previewItem}>
            <span className={styles.previewItemLabel}>出發時間</span>
            <span className={styles.previewItemValue}>{time}</span>
          </div>
          <div className={styles.previewItem}>
            <span className={styles.previewItemLabel}>偏好</span>
            <span className={styles.previewItemValue}>
              {prefs.length > 0
                ? prefs.map((pref) => preferenceOptions.find((option) => option.id === pref)?.label).join('、')
                : '未設定'}
            </span>
          </div>

          <div className={styles.previewInsightBox}>
            <p className={styles.previewInsightTitle}>系統怎麼判讀</p>
            <ul className={styles.previewInsightList}>
              <li>照明與主幹道資料會影響最後一段步行風險</li>
              <li>捷運末班、公車班距與 YouBike 即時供給會影響交通排序</li>
              <li>派出所、CCTV、消防與醫療據點會拉高夜間友善度</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PlanPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div className={`container ${styles.pageContainer}`}><p>載入中...</p></div>}>
        <PlanContent />
      </Suspense>
      <Footer />
    </>
  );
}
