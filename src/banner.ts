export type BannerHeight = 'compact' | 'medium' | 'large';
export type BannerPosition = 'left' | 'center' | 'right';
export type BannerTitlePlacement = 'over' | 'below';

export interface BannerPreset {
  id: string;
  nameKey: string;
  defaultName: string;
  url: string;
  gradientFallback: string;
  category: 'floral' | 'aesthetic' | 'texture' | 'nature';
}

export interface BannerConfig {
  presetId: string;
  customUrl?: string;
  customDataUrl?: string;
  height: BannerHeight;
  position: BannerPosition;
  titlePlacement: BannerTitlePlacement;
  showOverlay: boolean;
}

export const BANNER_PRESETS: BannerPreset[] = [
  {
    id: 'cherry-blossom',
    nameKey: 'presetCherryBlossom',
    defaultName: 'Cherry Blossom (Sakura)',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)',
    category: 'floral',
  },
  {
    id: 'soft-pink',
    nameKey: 'presetSoftPink',
    defaultName: 'Soft Pink Silk Aesthetic',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(135deg, #ff9a9e 0%, #fecfef 99%, #fecfef 100%)',
    category: 'aesthetic',
  },
  {
    id: 'minimal-paper',
    nameKey: 'presetMinimalPaper',
    defaultName: 'Minimal Washi Texture',
    url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(to top, #cfd9df 0%, #e2ebf0 100%)',
    category: 'texture',
  },
  {
    id: 'soft-floral',
    nameKey: 'presetSoftFloral',
    defaultName: 'Soft Botanical Floral',
    url: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)',
    category: 'floral',
  },
  {
    id: 'minimal-neutral',
    nameKey: 'presetMinimalNeutral',
    defaultName: 'Warm Neutral Linen',
    url: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(to top, #e6e9f0 0%, #eef1f5 100%)',
    category: 'texture',
  },
  {
    id: 'seasonal-aesthetic',
    nameKey: 'presetSeasonal',
    defaultName: 'Seasonal Autumn Warmth',
    url: 'https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(to top, #fbc2eb 0%, #a18cd1 100%)',
    category: 'nature',
  },
  {
    id: 'ethereal-mist',
    nameKey: 'presetEtherealCloud',
    defaultName: 'Ethereal Morning Mist',
    url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1600&q=80',
    gradientFallback: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    category: 'nature',
  },
];

export const DEFAULT_BANNER_CONFIG: BannerConfig = {
  presetId: 'cherry-blossom',
  height: 'medium',
  position: 'center',
  titlePlacement: 'below',
  showOverlay: true,
};

export const STORAGE_KEY_BANNER = 'sashas_banner_config';
export const STORAGE_KEY_BANNER_CUSTOM_IMAGE = 'sashas_banner_custom_image';

export function getStoredBannerConfig(): BannerConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_BANNER);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Retrieve custom image if present
      const customDataUrl = localStorage.getItem(STORAGE_KEY_BANNER_CUSTOM_IMAGE) || undefined;
      return {
        ...DEFAULT_BANNER_CONFIG,
        ...parsed,
        customDataUrl: customDataUrl || parsed.customDataUrl,
      };
    }
  } catch (e) {
    console.warn('Could not read banner configuration from localStorage', e);
  }
  return DEFAULT_BANNER_CONFIG;
}

export const loadBannerConfig = getStoredBannerConfig;
export const saveBannerConfig = setStoredBannerConfig;

export function setStoredBannerConfig(config: BannerConfig): void {
  try {
    // Separate custom large data URL into separate key to prevent JSON bloating
    if (config.customDataUrl) {
      try {
        localStorage.setItem(STORAGE_KEY_BANNER_CUSTOM_IMAGE, config.customDataUrl);
      } catch (quotaError) {
        console.warn('Custom image upload too large for localStorage quota', quotaError);
      }
    } else {
      localStorage.removeItem(STORAGE_KEY_BANNER_CUSTOM_IMAGE);
    }

    const { customDataUrl, ...persistentConfig } = config;
    localStorage.setItem(STORAGE_KEY_BANNER, JSON.stringify(persistentConfig));
  } catch (e) {
    console.warn('Could not save banner configuration to localStorage', e);
  }
}

/**
 * Returns the effective image source and CSS properties for the banner
 */
export function getBannerEffectiveSource(config: BannerConfig): {
  imageUrl: string;
  fallbackGradient: string;
  objectPosition: string;
  heightClass: string;
} {
  let imageUrl = '';
  let fallbackGradient = 'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)';

  if (config.presetId === 'custom-upload' && config.customDataUrl) {
    imageUrl = config.customDataUrl;
  } else if (config.presetId === 'custom-url' && config.customUrl) {
    imageUrl = config.customUrl;
  } else {
    const found = BANNER_PRESETS.find((p) => p.id === config.presetId);
    if (found) {
      imageUrl = found.url;
      fallbackGradient = found.gradientFallback;
    } else {
      imageUrl = BANNER_PRESETS[0].url;
      fallbackGradient = BANNER_PRESETS[0].gradientFallback;
    }
  }

  let objectPosition = 'center center';
  if (config.position === 'left') {
    objectPosition = 'left center';
  } else if (config.position === 'right') {
    objectPosition = 'right center';
  }

  let heightClass = 'h-40 sm:h-52'; // default medium
  if (config.height === 'compact') {
    heightClass = 'h-28 sm:h-36';
  } else if (config.height === 'large') {
    heightClass = 'h-52 sm:h-72';
  }

  return {
    imageUrl,
    fallbackGradient,
    objectPosition,
    heightClass,
  };
}
