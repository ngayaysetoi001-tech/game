// Bảng màu thủy mặc: giấy dó + mực tàu, điểm xuyết màu linh khí.

import type { Element, PathId } from '../../engine/data';

export const INK = {
  dark: '#1b1815',
  mid: '#3d3731',
  seal: '#b8382c',
};

/** Màu hào quang theo đại cảnh giới (chỉ số REALMS) */
export const REALM_AURA = [
  '#f2ead8', // Luyện Khí: bạch khí
  '#7fd6c9', // Trúc Cơ: thanh khí
  '#f0c35a', // Kim Đan: kim quang
  '#b48cff', // Nguyên Anh: tử khí
  '#ff8a5c', // Hóa Thần: xích diễm
  '#6fb2ff', // Luyện Hư: lam quang
  '#8fe39a', // Hợp Thể: lục quang
  '#fff3c4', // Đại Thừa: bạch kim
  '#d9a6ff', // Độ Kiếp: lôi quang
];

export const ELEMENT_COLORS: Record<Element, string> = {
  Kim: '#e8c55a',
  Mộc: '#5fbf6a',
  Thủy: '#4fa3e0',
  Hỏa: '#e5654b',
  Thổ: '#b58552',
  Lôi: '#b58cff',
  Phong: '#7fe0c8',
  Băng: '#a8e4ff',
};

export const TIER_COLORS = ['#cfc6b4', '#7fcf8a', '#6fb2ff', '#d39cff'];

export const PATH_COLORS: Record<PathId | 'none', string> = {
  none: '#9a8f7c',
  kiem: '#7fc8ff',
  the: '#e0a050',
  phap: '#c08cff',
};

export interface SceneTheme {
  /** Giấy: trên → dưới */
  paper: [string, string];
  /** Mực núi xa → gần */
  ink: [string, string];
  mist: string;
  sun: string;
  feature: 'pines' | 'blood' | 'canyon' | 'ruins' | 'sea' | 'ghost' | 'palace' | 'void' | 'cave';
}

/** Chủ đề tranh cho động phủ và 8 khu bí cảnh (cùng thứ tự ZONES) */
export const HOME_THEME: SceneTheme = {
  paper: ['#efe6d2', '#dccfb4'],
  ink: ['#8d8476', '#2b2621'],
  mist: '#f5efe2',
  sun: '#c9483a',
  feature: 'pines',
};

export const CAVE_THEME: SceneTheme = {
  paper: ['#3a332b', '#211d19'],
  ink: ['#5a5046', '#120f0d'],
  mist: '#6d6253',
  sun: '#f0c35a',
  feature: 'cave',
};

export const ZONE_THEMES: SceneTheme[] = [
  { paper: ['#e6e4d0', '#cfd2b8'], ink: ['#7d8a78', '#1f2a20'], mist: '#eef0e2', sun: '#c9483a', feature: 'pines' },
  { paper: ['#ecd6c8', '#d4a99a'], ink: ['#8a5c55', '#2c1513'], mist: '#f3e2d8', sun: '#a51f1f', feature: 'blood' },
  { paper: ['#efdcbc', '#d9bb8c'], ink: ['#9a7a55', '#33230f'], mist: '#f6ead2', sun: '#d8662f', feature: 'canyon' },
  { paper: ['#d6d0cb', '#a9a19c'], ink: ['#6e6670', '#191419'], mist: '#e3dedb', sun: '#7a2a2a', feature: 'ruins' },
  { paper: ['#d9e3e6', '#b3c6cc'], ink: ['#6a8590', '#14262d'], mist: '#eaf1f2', sun: '#e6d36a', feature: 'sea' },
  { paper: ['#3b4440', '#1c2320'], ink: ['#56645d', '#0b100e'], mist: '#4d5d55', sun: '#9fe3b8', feature: 'ghost' },
  { paper: ['#f1e6c6', '#e0cc96'], ink: ['#a8935e', '#3a2e12'], mist: '#fbf3dc', sun: '#e9b53f', feature: 'palace' },
  { paper: ['#2a2238', '#120e1a'], ink: ['#4a3d63', '#07050c'], mist: '#3b3150', sun: '#c79bff', feature: 'void' },
];
