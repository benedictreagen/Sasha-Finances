import { ThemeMode } from './types';

export interface ThemeMeta {
  id: ThemeMode;
  name: string;
  tagline: string;
  type: 'light' | 'dark';
  preview: {
    bg: string;
    surface: string;
    accent: string;
    text: string;
    border: string;
  };
}

export interface ThemeTokens {
  id: ThemeMode;
  isDark: boolean;
  appBg: string;
  navBg: string;
  cardBg: string;
  cardAlt: string;
  inputBg: string;
  labelColor: string;
  tableHeaderBg: string;
  rowHoverBg: string;
  accentColor: string;
  accentText: string;
  accentBadge: string;
  accentBorder: string;
  activeTabBg: string;
  borderColor: string;
  barBg: string;
  // Raw hex codes for CSS vars & charts
  hex: {
    bg: string;
    surface: string;
    surfaceAlt: string;
    text: string;
    label: string;
    border: string;
    accent: string;
    accentHover: string;
  };
}

export const THEMES: ThemeMeta[] = [
  {
    id: 'light',
    name: 'Light',
    tagline: 'Warm editorial off-white with amber warmth',
    type: 'light',
    preview: {
      bg: '#F7F6F3',
      surface: '#FFFFFF',
      accent: '#F59E0B',
      text: '#37352F',
      border: '#E9E9E7',
    },
  },
  {
    id: 'dark',
    name: 'Dark',
    tagline: 'Minimalist obsidian charcoal with amber glow',
    type: 'dark',
    preview: {
      bg: '#191919',
      surface: '#252525',
      accent: '#F59E0B',
      text: '#EBEBEB',
      border: '#373737',
    },
  },
  {
    id: 'cherry-blossom',
    name: 'Cherry Blossom',
    tagline: 'Delicate sakura blush and rosy elegance',
    type: 'light',
    preview: {
      bg: '#FFF5F7',
      surface: '#FFFFFF',
      accent: '#F43F5E',
      text: '#4C1D2E',
      border: '#FCE7F0',
    },
  },
  {
    id: 'spring',
    name: 'Spring',
    tagline: 'Fresh botanical sage and crisp emerald vitality',
    type: 'light',
    preview: {
      bg: '#F3F9F5',
      surface: '#FFFFFF',
      accent: '#059669',
      text: '#1E3A2B',
      border: '#E1EFE7',
    },
  },
  {
    id: 'winter',
    name: 'Winter',
    tagline: 'Glacial frost, alpine twilight and azure clarity',
    type: 'light',
    preview: {
      bg: '#F0F5FA',
      surface: '#FFFFFF',
      accent: '#0284C7',
      text: '#1E293B',
      border: '#E0EBF5',
    },
  },
  {
    id: 'berry',
    name: 'Berry',
    tagline: 'Velvety blackberry, boysenberry and rich plum nectar',
    type: 'dark',
    preview: {
      bg: '#18101E',
      surface: '#271B30',
      accent: '#D946EF',
      text: '#F3E8F5',
      border: '#3D254B',
    },
  },
  {
    id: 'cloud',
    name: 'Cloud',
    tagline: 'Ethereal overcast silver mist and celestial lavender-slate',
    type: 'light',
    preview: {
      bg: '#F4F5F8',
      surface: '#FFFFFF',
      accent: '#6366F1',
      text: '#272B35',
      border: '#E3E6EE',
    },
  },
];

export const THEME_TOKENS: Record<ThemeMode, ThemeTokens> = {
  light: {
    id: 'light',
    isDark: false,
    appBg: 'bg-[#F7F6F3] text-[#37352F]',
    navBg: 'bg-[#FFFFFF] border-[#E9E9E7]',
    cardBg: 'bg-[#FFFFFF] border-[#E9E9E7] text-[#37352F]',
    cardAlt: 'bg-[#FBFBFA] border-[#E9E9E7]',
    inputBg: 'bg-[#FBFBFA] border-[#E9E9E7] text-[#37352F]',
    labelColor: 'text-[#787774]',
    tableHeaderBg: 'bg-[#F7F6F3]',
    rowHoverBg: 'hover:bg-[#F1F1EF]',
    accentColor: 'bg-amber-500 hover:bg-amber-600 text-black',
    accentText: 'text-amber-600',
    accentBadge: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    accentBorder: 'border-amber-500/30',
    activeTabBg: 'bg-amber-500 text-black shadow-2xs font-semibold',
    borderColor: 'border-[#E9E9E7]',
    barBg: 'bg-black/10',
    hex: {
      bg: '#F7F6F3',
      surface: '#FFFFFF',
      surfaceAlt: '#FBFBFA',
      text: '#37352F',
      label: '#787774',
      border: '#E9E9E7',
      accent: '#F59E0B',
      accentHover: '#D97706',
    },
  },
  dark: {
    id: 'dark',
    isDark: true,
    appBg: 'bg-[#191919] text-[#EBEBEB]',
    navBg: 'bg-[#202020] border-[#373737]',
    cardBg: 'bg-[#252525] border-[#373737] text-[#EBEBEB]',
    cardAlt: 'bg-[#202020] border-[#373737]',
    inputBg: 'bg-[#191919] border-[#373737] text-[#EBEBEB]',
    labelColor: 'text-[#9B9A97]',
    tableHeaderBg: 'bg-[#1F1F1F]',
    rowHoverBg: 'hover:bg-[#2A2A2A]',
    accentColor: 'bg-amber-500 hover:bg-amber-600 text-black',
    accentText: 'text-amber-400',
    accentBadge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    accentBorder: 'border-amber-500/30',
    activeTabBg: 'bg-amber-500 text-black shadow-2xs font-semibold',
    borderColor: 'border-[#373737]',
    barBg: 'bg-white/10',
    hex: {
      bg: '#191919',
      surface: '#252525',
      surfaceAlt: '#202020',
      text: '#EBEBEB',
      label: '#9B9A97',
      border: '#373737',
      accent: '#F59E0B',
      accentHover: '#D97706',
    },
  },
  'cherry-blossom': {
    id: 'cherry-blossom',
    isDark: false,
    appBg: 'bg-[#FFF5F7] text-[#4C1D2E]',
    navBg: 'bg-[#FFFFFF] border-[#FCE7F0]',
    cardBg: 'bg-[#FFFFFF] border-[#FCE7F0] text-[#4C1D2E]',
    cardAlt: 'bg-[#FFF0F4] border-[#FBD5E5]',
    inputBg: 'bg-[#FFF0F4] border-[#FBD5E5] text-[#4C1D2E]',
    labelColor: 'text-[#9F5D74]',
    tableHeaderBg: 'bg-[#FFE8F0]',
    rowHoverBg: 'hover:bg-[#FFF0F4]',
    accentColor: 'bg-rose-500 hover:bg-rose-600 text-white',
    accentText: 'text-rose-600',
    accentBadge: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    accentBorder: 'border-rose-500/30',
    activeTabBg: 'bg-rose-500 text-white shadow-2xs font-semibold',
    borderColor: 'border-[#FCE7F0]',
    barBg: 'bg-rose-950/10',
    hex: {
      bg: '#FFF5F7',
      surface: '#FFFFFF',
      surfaceAlt: '#FFF0F4',
      text: '#4C1D2E',
      label: '#9F5D74',
      border: '#FCE7F0',
      accent: '#F43F5E',
      accentHover: '#E11D48',
    },
  },
  spring: {
    id: 'spring',
    isDark: false,
    appBg: 'bg-[#F3F9F5] text-[#1E3A2B]',
    navBg: 'bg-[#FFFFFF] border-[#E1EFE7]',
    cardBg: 'bg-[#FFFFFF] border-[#E1EFE7] text-[#1E3A2B]',
    cardAlt: 'bg-[#EEF7F1] border-[#D3E9DC]',
    inputBg: 'bg-[#EEF7F1] border-[#D3E9DC] text-[#1E3A2B]',
    labelColor: 'text-[#587967]',
    tableHeaderBg: 'bg-[#E7F3EC]',
    rowHoverBg: 'hover:bg-[#EDF7F1]',
    accentColor: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    accentText: 'text-emerald-700',
    accentBadge: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20',
    accentBorder: 'border-emerald-500/30',
    activeTabBg: 'bg-emerald-600 text-white shadow-2xs font-semibold',
    borderColor: 'border-[#E1EFE7]',
    barBg: 'bg-emerald-950/10',
    hex: {
      bg: '#F3F9F5',
      surface: '#FFFFFF',
      surfaceAlt: '#EEF7F1',
      text: '#1E3A2B',
      label: '#587967',
      border: '#E1EFE7',
      accent: '#059669',
      accentHover: '#047857',
    },
  },
  winter: {
    id: 'winter',
    isDark: false,
    appBg: 'bg-[#F0F5FA] text-[#1E293B]',
    navBg: 'bg-[#FFFFFF] border-[#E0EBF5]',
    cardBg: 'bg-[#FFFFFF] border-[#E0EBF5] text-[#1E293B]',
    cardAlt: 'bg-[#EAF1F8] border-[#D3E2F0]',
    inputBg: 'bg-[#EAF1F8] border-[#D3E2F0] text-[#1E293B]',
    labelColor: 'text-[#64748B]',
    tableHeaderBg: 'bg-[#E3EDF7]',
    rowHoverBg: 'hover:bg-[#EAF2F9]',
    accentColor: 'bg-sky-600 hover:bg-sky-700 text-white',
    accentText: 'text-sky-600',
    accentBadge: 'bg-sky-500/10 text-sky-600 border-sky-500/20',
    accentBorder: 'border-sky-500/30',
    activeTabBg: 'bg-sky-600 text-white shadow-2xs font-semibold',
    borderColor: 'border-[#E0EBF5]',
    barBg: 'bg-slate-900/10',
    hex: {
      bg: '#F0F5FA',
      surface: '#FFFFFF',
      surfaceAlt: '#EAF1F8',
      text: '#1E293B',
      label: '#64748B',
      border: '#E0EBF5',
      accent: '#0284C7',
      accentHover: '#0369A1',
    },
  },
  berry: {
    id: 'berry',
    isDark: true,
    appBg: 'bg-[#18101E] text-[#F3E8F5]',
    navBg: 'bg-[#22172A] border-[#3D254B]',
    cardBg: 'bg-[#271B30] border-[#3D254B] text-[#F3E8F5]',
    cardAlt: 'bg-[#201528] border-[#3D254B]',
    inputBg: 'bg-[#1A1121] border-[#3D254B] text-[#F3E8F5]',
    labelColor: 'text-[#AC8EB5]',
    tableHeaderBg: 'bg-[#23172C]',
    rowHoverBg: 'hover:bg-[#2E1E39]',
    accentColor: 'bg-fuchsia-600 hover:bg-fuchsia-700 text-white',
    accentText: 'text-fuchsia-400',
    accentBadge: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
    accentBorder: 'border-fuchsia-500/30',
    activeTabBg: 'bg-fuchsia-600 text-white shadow-2xs font-semibold',
    borderColor: 'border-[#3D254B]',
    barBg: 'bg-white/10',
    hex: {
      bg: '#18101E',
      surface: '#271B30',
      surfaceAlt: '#201528',
      text: '#F3E8F5',
      label: '#AC8EB5',
      border: '#3D254B',
      accent: '#D946EF',
      accentHover: '#C026D3',
    },
  },
  cloud: {
    id: 'cloud',
    isDark: false,
    appBg: 'bg-[#F4F5F8] text-[#272B35]',
    navBg: 'bg-[#FFFFFF] border-[#E3E6EE]',
    cardBg: 'bg-[#FFFFFF] border-[#E3E6EE] text-[#272B35]',
    cardAlt: 'bg-[#ECEEF3] border-[#D9DDE6]',
    inputBg: 'bg-[#ECEEF3] border-[#D9DDE6] text-[#272B35]',
    labelColor: 'text-[#737A8C]',
    tableHeaderBg: 'bg-[#E7EAF1]',
    rowHoverBg: 'hover:bg-[#EFF1F5]',
    accentColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    accentText: 'text-indigo-600',
    accentBadge: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20',
    accentBorder: 'border-indigo-500/30',
    activeTabBg: 'bg-indigo-600 text-white shadow-2xs font-semibold',
    borderColor: 'border-[#E3E6EE]',
    barBg: 'bg-slate-900/10',
    hex: {
      bg: '#F4F5F8',
      surface: '#FFFFFF',
      surfaceAlt: '#ECEEF3',
      text: '#272B35',
      label: '#737A8C',
      border: '#E3E6EE',
      accent: '#6366F1',
      accentHover: '#4F46E5',
    },
  },
};

export const getThemeTokens = (theme: ThemeMode = 'dark'): ThemeTokens => {
  return THEME_TOKENS[theme] || THEME_TOKENS.dark;
};

export const applyGlobalTheme = (theme: ThemeMode): ThemeTokens => {
  const tokens = getThemeTokens(theme);

  if (typeof document !== 'undefined') {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    if (tokens.isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set CSS custom properties
    root.style.setProperty('--app-bg', tokens.hex.bg);
    root.style.setProperty('--app-surface', tokens.hex.surface);
    root.style.setProperty('--app-surface-alt', tokens.hex.surfaceAlt);
    root.style.setProperty('--app-text', tokens.hex.text);
    root.style.setProperty('--app-label', tokens.hex.label);
    root.style.setProperty('--app-border', tokens.hex.border);
    root.style.setProperty('--app-accent', tokens.hex.accent);
    root.style.setProperty('--app-accent-hover', tokens.hex.accentHover);
  }

  return tokens;
};

export const getStoredTheme = (): ThemeMode => {
  try {
    const saved = localStorage.getItem('sashas_theme') as ThemeMode;
    if (saved && THEME_TOKENS[saved]) {
      return saved;
    }
  } catch {
    // Fallback
  }
  return 'dark';
};

export const setStoredTheme = (theme: ThemeMode) => {
  try {
    localStorage.setItem('sashas_theme', theme);
  } catch (e) {
    console.warn('Failed to persist theme to localStorage:', e);
  }
};
