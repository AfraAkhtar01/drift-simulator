export interface ThemeConfig {
  ground: string;
  sky: string;
  fog: string;
  building: string;
  tree: string;
  trunk: string;
  road: string;
  ambient: number;
  sunIntensity: number;
}

const configs: Record<string, Record<string, ThemeConfig>> = {
  city: {
    day:   { ground: '#3a3a3a', sky: '#87CEEB', fog: '#87CEEB', building: '#777', tree: '#2E7D32', trunk: '#5D4037', road: '#222', ambient: 0.5, sunIntensity: 1.2 },
    night: { ground: '#1a1a1a', sky: '#080820', fog: '#080820', building: '#333', tree: '#1B5E20', trunk: '#3E2723', road: '#111', ambient: 0.15, sunIntensity: 0.2 },
  },
  desert: {
    day:   { ground: '#D2B48C', sky: '#F5DEB3', fog: '#e8c8a0', building: '#C4A882', tree: '#8B7355', trunk: '#5D4037', road: '#444', ambient: 0.7, sunIntensity: 1.5 },
    night: { ground: '#8B7355', sky: '#0d0a1a', fog: '#0d0a1a', building: '#6B5B45', tree: '#5D4037', trunk: '#3E2723', road: '#222', ambient: 0.15, sunIntensity: 0.2 },
  },
  snow: {
    day:   { ground: '#E8E8F0', sky: '#C8D8E8', fog: '#D8E8F0', building: '#BBBBCC', tree: '#E0E0E0', trunk: '#5D4037', road: '#556', ambient: 0.6, sunIntensity: 1.0 },
    night: { ground: '#8888A0', sky: '#060610', fog: '#060610', building: '#555566', tree: '#9999AA', trunk: '#3E2723', road: '#333', ambient: 0.15, sunIntensity: 0.15 },
  },
  mountain: {
    day:   { ground: '#4A7C59', sky: '#87CEEB', fog: '#87CEEB', building: '#8B7355', tree: '#2E7D32', trunk: '#5D4037', road: '#333', ambient: 0.5, sunIntensity: 1.2 },
    night: { ground: '#2A4C39', sky: '#080820', fog: '#080820', building: '#5B4335', tree: '#1B5E20', trunk: '#3E2723', road: '#222', ambient: 0.15, sunIntensity: 0.2 },
  },
  tokyo: {
    day:   { ground: '#4a4a5a', sky: '#9AB8D6', fog: '#9AB8D6', building: '#6B6B8B', tree: '#3A8B4E', trunk: '#4A3728', road: '#2a2a3a', ambient: 0.45, sunIntensity: 1.0 },
    night: { ground: '#1a1a2e', sky: '#0a0a20', fog: '#0a0a20', building: '#2a2a4e', tree: '#1A4B2E', trunk: '#2E1E15', road: '#111', ambient: 0.1, sunIntensity: 0.15 },
  },
  coastal: {
    day:   { ground: '#C2B280', sky: '#4FC3F7', fog: '#81D4FA', building: '#A08B6B', tree: '#388E3C', trunk: '#6D4C41', road: '#555', ambient: 0.6, sunIntensity: 1.4 },
    night: { ground: '#7A6B50', sky: '#051530', fog: '#051530', building: '#5A4B3B', tree: '#1B5E20', trunk: '#3E2723', road: '#222', ambient: 0.12, sunIntensity: 0.18 },
  },
  forest: {
    day:   { ground: '#3B5323', sky: '#6BBF59', fog: '#8BC88B', building: '#5D4037', tree: '#1B5E20', trunk: '#3E2723', road: '#2a3a2a', ambient: 0.35, sunIntensity: 0.8 },
    night: { ground: '#1A2A13', sky: '#040810', fog: '#040810', building: '#3A2A1A', tree: '#0A3A10', trunk: '#2A1A0A', road: '#111', ambient: 0.08, sunIntensity: 0.1 },
  },
  industrial: {
    day:   { ground: '#555555', sky: '#8899AA', fog: '#99AABB', building: '#666', tree: '#4A6B3A', trunk: '#4A3A2A', road: '#333', ambient: 0.4, sunIntensity: 0.9 },
    night: { ground: '#2A2A2A', sky: '#0A0A15', fog: '#0A0A15', building: '#333', tree: '#2A3B1A', trunk: '#2A1A0A', road: '#111', ambient: 0.1, sunIntensity: 0.15 },
  },
};

export function getTheme(theme: string, time: string): ThemeConfig {
  return configs[theme]?.[time] || configs.city.day;
}
