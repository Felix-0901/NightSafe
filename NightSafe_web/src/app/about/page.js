import {
  Shield, Database, AlertTriangle, Users, Code, Brain,
  CheckCircle, Target
} from 'lucide-react';
import Navbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { publicDataCatalog } from '@/data/publicDataCatalog';
import styles from '../pages.module.css';

export const metadata = {
  title: '關於 NightSafe — 雙北夜間安全路徑決策系統',
  description: '了解 NightSafe v2 的資料來源、路徑引擎、評分模型與產品定位。',
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className={`container ${styles.pageContainer}`}>
        {/* Hero */}
        <div className={styles.aboutHero}>
          <div className={styles.pageTag} style={{ background: 'var(--color-green-soft)', color: 'var(--color-cta)' }}>
            <Shield size={14} />
            關於 NightSafe
          </div>
          <h1 className={styles.pageTitle}>
            讓夜間移動<br />
            <span className="gradient-text">更安心的選擇</span>
          </h1>
          <p className={styles.pageDesc} style={{ maxWidth: 600 }}>
            NightSafe v2 是一個以雙北真實路徑與官方資料為核心的夜間安全路徑決策系統。
            我們把地理編碼、OSRM 路線、雙北開放資料與環境訊號整合成可解釋的夜間移動建議。
          </p>
        </div>

        {/* Mission & Value */}
        <div className={styles.aboutGrid}>
          <div className={styles.aboutCard}>
            <h3 className={styles.aboutCardTitle}>
              <Target size={20} style={{ color: 'var(--color-cta)' }} />
              專案定位
            </h3>
            <div className={styles.aboutCardContent}>
              <p>NightSafe 是一個為夜間外出者提供資料驅動夜間路徑判讀的平台。</p>
              <ul>
                <li>更真實：真實地理編碼與 OSRM 路線，不再只畫假軌跡</li>
                <li>更清楚：把複雜的交通與環境資訊變成能理解的建議</li>
                <li>更彈性：保留最快、夜間友善、低成本三種候選方案</li>
                <li>更即時：YouBike、天氣、空品與施工訊號可即時修正</li>
                <li>更落地：以雙北與中央機關開放資料為基礎</li>
              </ul>
            </div>
          </div>

          <div className={styles.aboutCard}>
            <h3 className={styles.aboutCardTitle}>
              <Brain size={20} style={{ color: 'var(--color-cyan)' }} />
              核心問題
            </h3>
            <div className={styles.aboutCardContent}>
              <p>大多數人夜間移動時面臨的疑問：</p>
              <ul>
                <li>哪條路比較適合晚上走？</li>
                <li>捷運、公車、YouBike 還是計程車？</li>
                <li>哪個出口或站點比較好？</li>
                <li>現在這個時間點，還有沒有車？</li>
                <li>附近哪裡比較亮、有人流、能求助？</li>
                <li>如果某站沒車、某路太暗，有替代方案嗎？</li>
              </ul>
            </div>
          </div>

          <div className={styles.aboutCard} id="data">
            <h3 className={styles.aboutCardTitle}>
              <Database size={20} style={{ color: 'var(--color-amber)' }} />
              資料來源
            </h3>
            <div className={styles.aboutCardContent}>
              <p>目前分析框架已納入雙北與中央開放資料：</p>
              <ul>
                {publicDataCatalog.slice(0, 10).map((source) => (
                  <li key={source.id}>{source.name} — {source.analysisUse}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className={styles.aboutCard}>
            <h3 className={styles.aboutCardTitle}>
              <Code size={20} style={{ color: 'var(--color-purple)' }} />
              夜間友善分數
            </h3>
            <div className={styles.aboutCardContent}>
              <p>每條路線的 NightSafe Score 由六組可解釋權重計算：</p>
              <ul>
                <li>照明與可視性 (25%) — 路燈密度、亮區與 CCTV 覆蓋</li>
                <li>安心錨點 (15%) — 警消醫療與停留節點密度</li>
                <li>交通連續性 (20%) — 交通模式在當前時段的可用性</li>
                <li>步行暴露 (20%) — 純步行時間與長度</li>
                <li>事故 / 施工風險 (10%) — 施工與歷史事故修正</li>
                <li>天氣 / AQI 修正 (10%) — 下雨與空品對夜間移動的影響</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimerBox} id="disclaimer">
          <h3>
            <AlertTriangle size={20} />
            免責聲明
          </h3>
          <p>
            NightSafe 是一個夜間移動決策輔助工具，不保證絕對安全。開放資料更新頻率有限，
            CCTV、派出所、路燈只能作為輔助指標。夜間人流與治安是動態因素，本平台不做即時風險預測。
            我們使用「夜間友善」而非「絕對安全」措辭，提供多方案比較降低誤導，並保留人工判斷空間。
            所有資料來源以雙北政府開放資料、中央氣象署與環境部公開資料為主。
          </p>
        </div>

        {/* Team */}
        <div id="team">
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="gradient-text">團隊成員</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>NightSafe 開發團隊</p>
          </div>

          <div className={styles.teamGrid}>
            {[
              { name: 'PM', role: '企劃 / 簡報', initial: 'P' },
              { name: 'Designer', role: 'UI/UX 設計', initial: 'D' },
              { name: 'Frontend', role: '前端開發', initial: 'F' },
              { name: 'Backend', role: '後端 / AI', initial: 'B' },
            ].map((m, i) => (
              <div key={i} className={styles.teamCard}>
                <div className={styles.teamAvatar}>{m.initial}</div>
                <div className={styles.teamName}>{m.name}</div>
                <div className={styles.teamRole}>{m.role}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Architecture */}
        <div className={styles.archSection}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="gradient-text">技術架構</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>資料聚合層 + 路徑引擎 + 評分模型 + AI 解釋層</p>
          </div>

          <div className={styles.archDiagram}>
            <div className={styles.archLayer} style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <div className={styles.archLayerTitle} style={{ color: 'var(--color-cta)' }}>前端層</div>
              <div className={styles.archLayerItems}>
                Next.js<br />
                React<br />
                Leaflet 地圖<br />
                CSS Modules
              </div>
            </div>
            <div className={styles.archLayer} style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <div className={styles.archLayerTitle} style={{ color: 'var(--color-cyan)' }}>資料聚合層</div>
              <div className={styles.archLayerItems}>
                路燈 / CCTV / 警政<br />
                醫療 / 廁所 / 避難<br />
                天氣 / AQI / 施工<br />
                bbox 圖層查詢
              </div>
            </div>
            <div className={styles.archLayer} style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
              <div className={styles.archLayerTitle} style={{ color: 'var(--color-amber)' }}>路徑與評分層</div>
              <div className={styles.archLayerItems}>
                Nominatim 地理編碼<br />
                OSRM 候選路線<br />
                分段風險評分<br />
                多方案排序
              </div>
            </div>
            <div className={styles.archLayer} style={{ borderColor: 'rgba(168, 85, 247, 0.3)' }}>
              <div className={styles.archLayerTitle} style={{ color: 'var(--color-purple)' }}>AI 說明層</div>
              <div className={styles.archLayerItems}>
                LLM API<br />
                結果解釋<br />
                行前提醒<br />
                備援方案說明
              </div>
            </div>
          </div>
        </div>

        {/* Vision */}
        <div style={{ marginBottom: 'var(--space-3xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)' }}>
            <h2 style={{ marginBottom: 'var(--space-sm)' }}>
              <span className="gradient-text">我們的願景</span>
            </h2>
            <p style={{ color: 'var(--color-text-muted)' }}>用 AI 翻轉城市夜間移動體驗</p>
          </div>

          <div className={styles.aboutGrid}>
            <div className={styles.aboutCard} style={{ borderColor: 'rgba(34, 197, 94, 0.3)' }}>
              <h3 className={styles.aboutCardTitle}>
                <CheckCircle size={20} style={{ color: 'var(--color-cta)' }} />
                更安心的城市
              </h3>
              <div className={styles.aboutCardContent}>
                <p>改善市民，尤其青年夜間移動時的安心感與可近性。提升夜間交通決策品質，展現開放資料的實際應用價值。</p>
              </div>
            </div>
            <div className={styles.aboutCard} style={{ borderColor: 'rgba(6, 182, 212, 0.3)' }}>
              <h3 className={styles.aboutCardTitle}>
                <CheckCircle size={20} style={{ color: 'var(--color-cyan)' }} />
                更友善的夜間
              </h3>
              <div className={styles.aboutCardContent}>
                <p>無論是晚間活動、觀光、演唱會散場、夜市移動，還是陌生地區返程，都能透過 NightSafe 找到更好的移動方案。</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
