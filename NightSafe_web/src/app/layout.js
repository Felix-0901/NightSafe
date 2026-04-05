import './globals.css';

export const metadata = {
  title: 'NightSafe — 夜間移動分析平台',
  description: '整合台北市官方開放資料與即時交通資訊，透過資料分析與 AI 解釋幫助使用者在夜間做出更清楚的移動選擇。',
  keywords: 'NightSafe, 夜間移動, 台北, 路線分析, YouBike, 開放資料, 夜間友善',
  openGraph: {
    title: 'NightSafe — 夜間移動分析平台',
    description: '用官方資料與 AI 解釋層幫助台北市民做夜間移動判讀',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-Hant">
      <body>
        {children}
      </body>
    </html>
  );
}
