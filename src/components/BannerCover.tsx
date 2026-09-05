import React, { useState } from 'react';
import { 
  BannerConfig, 
  getBannerEffectiveSource 
} from '../banner';
import { Language, t } from '../i18n';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Plus, 
  Settings as SettingsIcon,
  Layers
} from 'lucide-react';

interface BannerCoverProps {
  config: BannerConfig;
  lang: Language;
  onAddTransactionClick: () => void;
  onOpenBannerSettings?: () => void;
  labelColor: string;
  theme?: string;
}

export const BannerCover: React.FC<BannerCoverProps> = ({
  config,
  lang,
  onAddTransactionClick,
  onOpenBannerSettings,
  labelColor,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const { imageUrl, fallbackGradient, objectPosition, heightClass } = getBannerEffectiveSource(config);

  const isTitleOver = config.titlePlacement === 'over';

  return (
    <div className="relative group w-full rounded-2xl overflow-hidden shadow-xs border border-inherit transition-all duration-300">
      {/* Banner Image Container */}
      <div 
        className={`relative w-full ${heightClass} overflow-hidden transition-all duration-300`}
        style={{
          background: fallbackGradient,
        }}
      >
        {imageUrl && !imageError && (
          <img
            src={imageUrl}
            alt="Dashboard Cover"
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{ objectPosition }}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
          />
        )}

        {/* Subtle Dark Gradient Overlay for Readability */}
        {config.showOverlay && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
        )}

        {/* Notion-Style Hover Action Bar on Banner Top-Right */}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 flex items-center space-x-1.5 z-20">
          {onOpenBannerSettings && (
            <button
              onClick={onOpenBannerSettings}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-[11px] font-medium transition-all shadow-sm border border-white/10 cursor-pointer"
              title={t('changeCover', lang)}
            >
              <ImageIcon className="w-3 h-3 text-amber-300" />
              <span>{t('changeCover', lang)}</span>
            </button>
          )}
        </div>

        {/* When Title is Placed OVER the Banner */}
        {isTitleOver && (
          <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="text-white drop-shadow-md">
              <div className="flex items-center space-x-2 mb-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md text-sm shadow-inner">
                  🌸
                </span>
                <span className="text-[10px] tracking-widest font-semibold uppercase px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white border border-white/20">
                  {t('liveReconciled', lang)}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-heading text-white tracking-tight">
                {t('dashboardTitle', lang)}
              </h1>
              <p className="text-xs text-white/80 font-medium max-w-xl line-clamp-1 sm:line-clamp-none">
                {t('dashboardSubtitle', lang)}
              </p>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={onAddTransactionClick}
                className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-md active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addTransaction', lang)}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* When Title is Placed BELOW the Banner (Standard Notion Page Style) */}
      {!isTitleOver && (
        <div className="pt-4 pb-2 px-1 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 -mt-7 sm:-mt-8 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-bold font-heading text-lg shadow-md border-2 border-white dark:border-[#191919] shrink-0">
              🌸
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl sm:text-2xl font-bold font-heading tracking-tight">
                  {t('dashboardTitle', lang)}
                </h1>
              </div>
              <p className={`text-xs mt-0.5 ${labelColor}`}>
                {t('dashboardSubtitle', lang)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
            {onOpenBannerSettings && (
              <button
                onClick={onOpenBannerSettings}
                className="inline-flex items-center space-x-1 px-3 py-2 rounded-xl border border-inherit text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
                title={t('changeCover', lang)}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">{t('changeCover', lang)}</span>
              </button>
            )}
            <button
              onClick={onAddTransactionClick}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-xs active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>{t('addTransaction', lang)}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
