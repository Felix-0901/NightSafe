'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield, ArrowRight, Sparkles, Map, Route,
  BookOpen, Music, Briefcase, MapPin, Compass, Wallet,
  Lightbulb, Layers, Brain, Clock, Bike, Camera,
  CheckCircle, Database, Zap, TrendingUp, Navigation
} from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { publicDataCatalog, publicDataSummary } from '@/data/publicDataCatalog';
import { getScenarioPreset } from '@/data/planningOptions';
import styles from './page.module.css';

const iconMap = {
  BookOpen, Music, Briefcase, MapPin, Compass, Wallet,
};

const sourceIconMap = {
  streetlight: Lightbulb,
  transit: Bike,
  anchor: Camera,
  medical: Shield,
  disruption: Database,
  environment: Sparkles,
};

const scenarios = [
  { id: 'study', icon: 'BookOpen', title: '晚自習返家', description: '補習班、晚自習結束後，優先規劃亮一點的路', gradient: 'linear-gradient(135deg, #22C55E20, #06B6D420)' },
  { id: 'event', icon: 'Music', title: '活動散場', description: '演唱會、展演、球賽散場後的人潮與末班風險', gradient: 'linear-gradient(135deg, #A855F720, #3B82F620)' },
  { id: 'work', icon: 'Briefcase', title: '夜班下班', description: '夜班、加班、打工後的返家判讀', gradient: 'linear-gradient(135deg, #F59E0B20, #F43F5E20)' },
  { id: 'tourist', icon: 'MapPin', title: '旅客夜間返程', description: '不熟悉地區時，優先主幹道與官方錨點', gradient: 'linear-gradient(135deg, #06B6D420, #22C55E20)' },
  { id: 'unfamiliar', icon: 'Compass', title: '陌生地區移動', description: '用資料補足對區域不熟的資訊落差', gradient: 'linear-gradient(135deg, #3B82F620, #A855F720)' },
  { id: 'budget', icon: 'Wallet', title: '低預算模式', description: '優先低成本備援，不放棄夜間友善底線', gradient: 'linear-gradient(135deg, #22C55E20, #F59E0B20)' },
];

const features = [
  {
    icon: <Brain size={28} />,
    title: '資料驅動分析',
    description: '把你的起點、終點、時間與偏好轉成可計算條件，再交給 AI 生成白話分析。',
    color: 'var(--color-cta)',
    bg: 'var(--color-green-soft)',
  },
  {
    icon: <Route size={28} />,
    title: '夜間友善分數',
    description: '綜合照明、安心錨點、交通可用性、主要道路比例與步行暴露進行排序。',
    color: 'var(--color-cyan)',
    bg: 'var(--color-cyan-soft)',
  },
  {
    icon: <Layers size={28} />,
    title: '多圖層官方資料',
    description: '把路燈、派出所、CCTV、消防、廁所與醫療等官方資料放到同一張圖裡判讀。',
    color: 'var(--color-purple)',
    bg: 'var(--color-purple-soft)',
  },
  {
    icon: <Zap size={28} />,
    title: '深夜備援策略',
    description: '當末班車風險提高，系統會自動拉高計程車、YouBike 與公車備援的權重。',
    color: 'var(--color-amber)',
    bg: 'var(--color-amber-soft)',
  },
  {
    icon: <Sparkles size={28} />,
    title: 'AI 解釋層',
    description: 'AI 不和使用者自由聊天，而是負責解釋資料計算結果與行前提醒。',
    color: 'var(--color-rose)',
    bg: 'var(--color-rose-soft)',
  },
  {
    icon: <TrendingUp size={28} />,
    title: '多方案比較',
    description: '同時提供最快、夜間友善、低成本三種方案，保留人工判斷空間。',
    color: 'var(--color-blue)',
    bg: 'var(--color-blue-soft)',
  },
];

const stats = [
  { value: `${publicDataSummary.totalStreetLights.toLocaleString()} 盞`, label: '官方路燈資料', color: 'var(--color-amber)' },
  { value: `${publicDataSummary.liveYouBikeStations.toLocaleString()} 站`, label: 'YouBike 即時站點', color: 'var(--color-cta)' },
  { value: `${publicDataSummary.sourceCount} 個`, label: '官方資料集', color: 'var(--color-blue)' },
  { value: `${publicDataSummary.categoryCount} 類`, label: '分析維度', color: 'var(--color-purple)' },
];

const featuredSources = publicDataCatalog.slice(0, 6);

export default function HomePage() {
  const router = useRouter();
  const [from, setFrom] = useState('台北車站');
  const [to, setTo] = useState('永春站');
  const [time, setTime] = useState('21:30');

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({
      from: from || '台北車站',
      to: to || '永春站',
      time,
    });
    router.push(`/results?${params.toString()}`);
  };

  const applyScenario = (scenarioId) => {
    const preset = getScenarioPreset(scenarioId);
    if (!preset) {
      return;
    }

    setFrom(preset.from);
    setTo(preset.to);
    setTime(preset.time);
  };

  return (
    <>
      <Navbar />

      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={`${styles.gradientOrb} ${styles.orb1}`} />
          <div className={`${styles.gradientOrb} ${styles.orb2}`} />
          <div className={`${styles.gradientOrb} ${styles.orb3}`} />
        </div>

        <div className={styles.heroContent}>
          <div className={styles.heroTag}>
            <Shield size={14} />
            <span>官方資料驅動 · 雙北夜間安全路徑決策</span>
          </div>

          <h1 className={styles.heroTitle}>
            夜間移動，<br />
            <span className={styles.heroHighlight}>先做資料判讀</span>
          </h1>

          <p className={styles.heroDesc}>
            NightSafe v2 不再只是展示點位，而是把雙北官方開放資料、OSRM 真實路線、環境訊號與你的設定條件
            一起交給決策引擎，再由 AI 補上可理解的理由與備援建議。
          </p>

          <form className={styles.searchBox} onSubmit={handleSearch}>
            <div className={styles.searchField}>
              <label className={styles.searchLabel}>起點</label>
              <div className={styles.searchControl}>
                <Navigation size={18} style={{ color: 'var(--color-cta)', minWidth: 18 }} />
                <input
                  className={styles.searchInput}
                  placeholder="例如：台北車站"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.searchField}>
              <label className={styles.searchLabel}>終點</label>
              <div className={styles.searchControl}>
                <MapPin size={18} style={{ color: 'var(--color-rose)', minWidth: 18 }} />
                <input
                  className={styles.searchInput}
                  placeholder="例如：永春站"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.searchField}>
              <label className={styles.searchLabel}>出發時間</label>
              <div className={styles.searchControl}>
                <Clock size={18} style={{ color: 'var(--color-amber)', minWidth: 18 }} />
                <input
                  type="time"
                  className={styles.searchInput}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className={styles.searchBtn}>
              <Sparkles size={16} />
              開始分析
            </button>
          </form>

          <div className={styles.heroHints}>
            {scenarios.slice(0, 3).map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                className={styles.hint}
                onClick={() => applyScenario(scenario.id)}
              >
                {scenario.title}
              </button>
            ))}
          </div>

          <div className={styles.heroSecondaryActions}>
            <Link href="/plan" className="btn btn-secondary btn-lg">
              進階設定
            </Link>
            <Link href="/map" className="btn btn-ghost btn-lg">
              看地圖圖層
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.scenarios}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag} style={{ background: 'var(--color-cyan-soft)', color: 'var(--color-cyan)' }}>
              <Map size={14} />
              情境快選
            </div>
            <h2 className={styles.sectionTitle}>你今晚要去哪？</h2>
            <p className={styles.sectionDesc}>直接套用常見夜間情境，再進一步調整細部偏好</p>
          </div>

          <div className={styles.scenarioGrid}>
            {scenarios.map((scenario) => {
              const Icon = iconMap[scenario.icon];
              return (
                <div
                  key={scenario.id}
                  className={styles.scenarioCard}
                  onClick={() => router.push(`/plan?scenario=${scenario.id}`)}
                >
                  <div className={styles.scenarioIcon} style={{ background: scenario.gradient }}>
                    <Icon size={24} />
                  </div>
                  <h3 className={styles.scenarioTitle}>{scenario.title}</h3>
                  <p className={styles.scenarioDesc}>{scenario.description}</p>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-cta)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    套用條件 <ArrowRight size={14} />
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={styles.features}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag} style={{ background: 'var(--color-green-soft)', color: 'var(--color-cta)' }}>
              <Sparkles size={14} />
              核心功能
            </div>
            <h2 className={styles.sectionTitle}>不是聊天，是判讀</h2>
            <p className={styles.sectionDesc}>網站負責蒐集資料與算分，AI 只負責把複雜判讀講清楚</p>
          </div>

          <div className={styles.featureGrid}>
            {features.map((feature, index) => (
              <div key={index} className={styles.featureCard}>
                <div className={styles.featureIcon} style={{ background: feature.bg, color: feature.color }}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDesc}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.stats}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTag} style={{ background: 'var(--color-blue-soft)', color: 'var(--color-blue)' }}>
              <Database size={14} />
              開放資料
            </div>
            <h2 className={styles.sectionTitle}>資料量不再只靠幾個點位</h2>
            <p className={styles.sectionDesc}>現在同時納入雙北資料、即時 YouBike、天氣與空品修正，不再只靠少量點位展示</p>
          </div>

          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statNumber} style={{ color: stat.color }}>
                  {stat.value}
                </div>
                <div className={styles.statLabel}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.trust}>
        <div className="container">
          <div className={styles.trustGrid}>
            <div className={styles.trustContent}>
              <h2>判讀的底線先講清楚</h2>
              <p>
                NightSafe 提供的是夜間移動決策輔助，不是安全保證。我們用官方資料建立照明、
                交通、求助與歷史訊號的比較框架，再讓 AI 將結果轉成清楚的建議與提醒。
              </p>

              <div className={styles.trustList}>
                <div className={styles.trustItem}>
                  <div className={styles.trustItemIcon} style={{ background: 'var(--color-green-soft)', color: 'var(--color-cta)' }}>
                    <CheckCircle size={20} />
                  </div>
                  <div className={styles.trustItemText}>
                    <h4>決策輔助，不做安全保證</h4>
                    <p>所有建議都保留人工判斷空間，避免絕對化措辭</p>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <div className={styles.trustItemIcon} style={{ background: 'var(--color-cyan-soft)', color: 'var(--color-cyan)' }}>
                    <Database size={20} />
                  </div>
                  <div className={styles.trustItemText}>
                    <h4>官方資料為核心</h4>
                    <p>資料來源以雙北市政府、中央氣象署與環境部開放資料為主</p>
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <div className={styles.trustItemIcon} style={{ background: 'var(--color-amber-soft)', color: 'var(--color-amber)' }}>
                    <Clock size={20} />
                  </div>
                  <div className={styles.trustItemText}>
                    <h4>時段感知</h4>
                    <p>會依出發時間判讀末班車、公車班距與深夜備援策略</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.trustVisual}>
              {featuredSources.map((source) => {
                const Icon = sourceIconMap[source.category] || Database;
                return (
                  <div key={source.id} className={styles.dataSource}>
                    <div className={styles.dataSourceIcon} style={{ background: 'var(--color-surface-raised)', color: 'var(--color-cta)' }}>
                      <Icon size={20} />
                    </div>
                    <div className={styles.dataSourceText}>
                      <span className={styles.dataSourceName}>{source.name}</span>
                      <span className={styles.dataSourceDesc}>{source.analysisUse}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta}>
        <div className="container">
          <div className={styles.ctaBox}>
            <h2>開始你的<span className="gradient-text">夜間移動規劃</span></h2>
            <p>先設定起點、終點與時間，再讓 NightSafe 幫你比較今晚的多種移動方案</p>
            <div className={styles.ctaButtons}>
              <Link href="/plan" className="btn btn-primary btn-lg">
                <Sparkles size={18} />
                開始規劃
              </Link>
              <Link href="/about" className="btn btn-secondary btn-lg">
                看資料來源
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
