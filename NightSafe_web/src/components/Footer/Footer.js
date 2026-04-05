import Link from 'next/link';
import { Shield } from 'lucide-react';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className="container">
        <div className={styles.footerGrid}>
          <div className={styles.footerBrand}>
            <div className={styles.brandLogo}>
              <div className={styles.brandIcon}>
                <Shield size={16} />
              </div>
              <span>NightSafe</span>
            </div>
            <p className={styles.brandDesc}>
              夜間移動分析平台。整合台北市官方開放資料與即時交通資訊，幫助使用者在夜間做出更好的移動決策。
            </p>
          </div>

          <div className={styles.footerSection}>
            <h4>功能</h4>
            <Link href="/plan" className={styles.footerLink}>路線規劃</Link>
            <Link href="/map" className={styles.footerLink}>地圖探索</Link>
            <Link href="/results" className={styles.footerLink}>方案比較</Link>
            <Link href="/about" className={styles.footerLink}>資料來源</Link>
          </div>

          <div className={styles.footerSection}>
            <h4>資源</h4>
            <Link href="/about" className={styles.footerLink}>關於平台</Link>
            <Link href="/about#data" className={styles.footerLink}>資料來源</Link>
            <Link href="/about#team" className={styles.footerLink}>團隊介紹</Link>
            <Link href="/about#disclaimer" className={styles.footerLink}>免責聲明</Link>
          </div>

          <div className={styles.footerSection}>
            <h4>開放資料</h4>
            <a href="https://data.taipei" target="_blank" rel="noopener noreferrer" className={styles.footerLink}>
              台北市資料大平臺
            </a>
            <span className={styles.footerLink}>YouBike 2.0 即時資訊</span>
            <span className={styles.footerLink}>路燈位置分布圖</span>
            <span className={styles.footerLink}>捷運出入口 / 公車到站 / CCTV / 派出所</span>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <p className={styles.copyright}>
            © 2026 NightSafe. All rights reserved.
          </p>
          <p className={styles.disclaimer}>
            本平台為夜間移動決策輔助工具，不保證絕對安全。資料來源以台北市政府官方開放資料為主。
          </p>
        </div>
      </div>
    </footer>
  );
}
