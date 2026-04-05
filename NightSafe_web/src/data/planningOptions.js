export const preferenceOptions = [
  {
    id: 'bright-route',
    label: '路燈多',
    icon: 'Lightbulb',
    description: '優先放大照明密度與主要道路權重',
  },
  {
    id: 'less-walking',
    label: '少走路',
    icon: 'Footprints',
    description: '縮短最後一段步行暴露時間',
  },
  {
    id: 'main-road',
    label: '走大路',
    icon: 'Route',
    description: '優先幹道與路口監視覆蓋較高路段',
  },
  {
    id: 'fastest',
    label: '最快到達',
    icon: 'Zap',
    description: '以總時間最短為主要排序條件',
  },
  {
    id: 'cheapest',
    label: '最省錢',
    icon: 'Wallet',
    description: '壓低總費用並保留低成本備援',
  },
  {
    id: 'less-transfer',
    label: '少轉乘',
    icon: 'ArrowRightLeft',
    description: '降低多段轉乘與夜間等待風險',
  },
  {
    id: 'crowded-route',
    label: '有人流',
    icon: 'Users',
    description: '偏好商圈、轉運節點與主要人流帶',
  },
  {
    id: 'public-transit',
    label: '大眾運輸',
    icon: 'Bus',
    description: '優先捷運、公車與 YouBike 接駁',
  },
];

export const scenarioPresets = {
  study: {
    from: '南陽街補習班',
    to: '景美站',
    time: '21:30',
    prefs: ['bright-route', 'less-walking', 'main-road'],
  },
  event: {
    from: '台北大巨蛋',
    to: '景美站',
    time: '23:10',
    prefs: ['less-transfer', 'crowded-route', 'public-transit'],
  },
  work: {
    from: '信義區辦公室',
    to: '板橋車站',
    time: '22:40',
    prefs: ['fastest', 'less-transfer'],
  },
  tourist: {
    from: '士林夜市',
    to: '西門町飯店',
    time: '22:00',
    prefs: ['bright-route', 'main-road', 'public-transit'],
  },
  unfamiliar: {
    from: '捷運公館站',
    to: '松山車站',
    time: '21:50',
    prefs: ['bright-route', 'crowded-route', 'main-road'],
  },
  budget: {
    from: '台北車站',
    to: '永春站',
    time: '21:45',
    prefs: ['cheapest', 'public-transit'],
  },
};

export function getScenarioPreset(id) {
  return scenarioPresets[id] || null;
}

export function getPreferenceLabel(id) {
  return preferenceOptions.find((option) => option.id === id)?.label || id;
}
