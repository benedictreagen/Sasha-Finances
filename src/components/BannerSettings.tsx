import React, { useState } from 'react';
import { 
  BannerConfig, 
  BannerHeight, 
  BannerPosition, 
  BannerTitlePlacement, 
  BANNER_PRESETS, 
  DEFAULT_BANNER_CONFIG, 
  getBannerEffectiveSource 
} from '../banner';
import { Language, t } from '../i18n';
import { 
  Image as ImageIcon, 
  Upload, 
  Link2, 
  RotateCcw, 
  Check, 
  Sparkles, 
  Eye, 
  Sliders,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface BannerSettingsProps {
  config: BannerConfig;
  onChangeConfig: (newConfig: BannerConfig) => void;
  lang: Language;
  cardBg: string;
  cardAlt: string;
  labelColor: string;
  inputBg: string;
}

export const BannerSettings: React.FC<BannerSettingsProps> = ({
  config,
  onChangeConfig,
  lang,
  cardBg,
  cardAlt,
  labelColor,
  inputBg,
}) => {
  const [urlInput, setUrlInput] = useState(config.customUrl || '');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [urlSuccess, setUrlSuccess] = useState(false);

  // Apply custom URL
  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    onChangeConfig({
      ...config,
      presetId: 'custom-url',
      customUrl: urlInput.trim(),
    });
    setUrlSuccess(true);
    setTimeout(() => setUrlSuccess(false), 2500);
  };

  // Handle local file upload (FileReader -> DataURL)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    // Check size limit (cap at ~2.5MB to fit reliably within localStorage quota)
    if (file.size > 2.5 * 1024 * 1024) {
      setUploadError(lang === 'id' ? 'Ukuran berkas maksimal 2.5MB agar pas di memori lokal.' : 'Image size limit is 2.5MB for browser local storage.');
      return;
    }

    if (!file.type.startsWith('image/')) {
      setUploadError(lang === 'id' ? 'Harap pilih berkas gambar (JPG, PNG, WebP).' : 'Please choose an image file (JPG, PNG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        onChangeConfig({
          ...config,
          presetId: 'custom-upload',
          customDataUrl: dataUrl,
        });
      }
    };
    reader.onerror = () => {
      setUploadError(lang === 'id' ? 'Gagal membaca berkas gambar.' : 'Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (presetId: string) => {
    onChangeConfig({
      ...config,
      presetId,
    });
  };

  const handleResetDefault = () => {
    onChangeConfig({ ...DEFAULT_BANNER_CONFIG });
    setUrlInput('');
    setUploadError(null);
  };

  const { imageUrl, fallbackGradient, objectPosition, heightClass } = getBannerEffectiveSource(config);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Live Preview Card */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-semibold font-heading">{t('bannerPreview', lang)}</h3>
          </div>
          <button
            type="button"
            onClick={handleResetDefault}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium cursor-pointer transition-colors ${cardAlt} hover:text-inherit`}
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('resetDefaultBanner', lang)}</span>
          </button>
        </div>

        {/* Live Preview Container */}
        <div 
          className={`relative w-full ${heightClass} rounded-xl overflow-hidden border border-inherit shadow-inner`}
          style={{ background: fallbackGradient }}
        >
          {imageUrl && (
            <img
              src={imageUrl}
              alt="Banner Preview"
              className="w-full h-full object-cover transition-all duration-300"
              style={{ objectPosition }}
              referrerPolicy="no-referrer"
            />
          )}

          {config.showOverlay && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
          )}

          <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 text-white text-xs font-medium flex items-center space-x-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {config.presetId === 'custom-upload'
                ? (lang === 'id' ? 'Gambar Unggahan Kustom' : 'Custom Uploaded Image')
                : config.presetId === 'custom-url'
                ? (lang === 'id' ? 'URL Gambar Kustom' : 'Custom Image Link')
                : t((BANNER_PRESETS.find((p) => p.id === config.presetId)?.nameKey as any) || 'presetCherryBlossom', lang)}
            </span>
          </div>
        </div>
      </div>

      {/* Built-in Curated Presets Grid */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="mb-4">
          <h3 className="text-base font-semibold font-heading mb-1">{t('bannerPresetTitle', lang)}</h3>
          <p className={`text-xs ${labelColor}`}>
            {lang === 'id' 
              ? 'Pilihan sampul estetik berkualitas tinggi yang serasi dengan tema Sasha’s Finance Dashboard.' 
              : 'Tastefully curated aesthetic banners designed to pair beautifully with all themes.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BANNER_PRESETS.map((preset) => {
            const isSelected = config.presetId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`group relative rounded-xl border p-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                    : 'border-inherit hover:border-amber-500/50'
                }`}
              >
                <div 
                  className="h-24 w-full rounded-lg overflow-hidden relative shadow-inner mb-2"
                  style={{ background: preset.gradientFallback }}
                >
                  <img
                    src={preset.url}
                    alt={preset.defaultName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold font-heading">
                    {t(preset.nameKey as any, lang)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Custom Banner Options: URL or Upload */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <h3 className="text-base font-semibold font-heading mb-1">{t('customImageUrl', lang)} & {t('uploadCustomImage', lang)}</h3>
        <p className={`text-xs mb-4 ${labelColor}`}>
          {t('uploadNote', lang)}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Custom URL Input */}
          <div className={`p-4 rounded-xl border ${cardAlt} space-y-3`}>
            <div className="flex items-center space-x-2">
              <Link2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold">{t('customImageUrl', lang)}</span>
            </div>
            <form onSubmit={handleApplyUrl} className="space-y-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={t('customImageUrlPlaceholder', lang)}
                className={`w-full px-3 py-2 rounded-xl border text-xs ${inputBg}`}
              />
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-black text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
              >
                {urlSuccess ? (lang === 'id' ? 'Berhasil Diterapkan!' : 'URL Applied!') : t('applyUrl', lang)}
              </button>
            </form>
          </div>

          {/* Local Upload */}
          <div className={`p-4 rounded-xl border ${cardAlt} space-y-3`}>
            <div className="flex items-center space-x-2">
              <Upload className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold">{t('uploadCustomImage', lang)}</span>
            </div>
            <p className={`text-[11px] ${labelColor}`}>
              {lang === 'id' 
                ? 'Pilih foto pemandangan, pola, atau wallpaper favorit dari perangkat Anda.'
                : 'Upload a personal scenic photo, texture, or aesthetic wallpaper from your device.'}
            </p>
            <label className="flex items-center justify-center w-full px-4 py-2 rounded-xl border border-dashed border-inherit hover:border-amber-500 cursor-pointer transition-colors text-xs font-medium text-amber-500 bg-amber-500/5">
              <ImageIcon className="w-3.5 h-3.5 mr-1.5" />
              <span>{lang === 'id' ? 'Pilih Berkas Foto...' : 'Choose Image File...'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadError && (
              <p className="text-[11px] text-rose-500 flex items-center space-x-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </p>
            )}
            {config.presetId === 'custom-upload' && (
              <p className="text-[11px] text-emerald-500 flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'id' ? 'Gambar kustom saat ini aktif.' : 'Custom image currently active.'}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Banner Layout Controls: Height, Positioning, Title Placement, Overlay */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center space-x-2 mb-4">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-base font-semibold font-heading">{lang === 'id' ? 'Tata Letak & Penyesuaian Sampul' : 'Cover Layout & Display Controls'}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Banner Height */}
          <div>
            <label className="block text-xs font-semibold mb-2">{t('bannerHeight', lang)}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['compact', 'medium', 'large'] as BannerHeight[]).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, height: h })}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    config.height === h
                      ? 'bg-amber-500 text-black font-semibold shadow-2xs border-amber-500'
                      : `${cardAlt} ${labelColor} hover:text-inherit`
                  }`}
                >
                  {h === 'compact' 
                    ? t('bannerHeightCompact', lang) 
                    : h === 'medium' 
                    ? t('bannerHeightMedium', lang) 
                    : t('bannerHeightLarge', lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Image Position */}
          <div>
            <label className="block text-xs font-semibold mb-2">{t('bannerPosition', lang)}</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['left', 'center', 'right'] as BannerPosition[]).map((pos) => (
                <button
                  key={pos}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, position: pos })}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    config.position === pos
                      ? 'bg-amber-500 text-black font-semibold shadow-2xs border-amber-500'
                      : `${cardAlt} ${labelColor} hover:text-inherit`
                  }`}
                >
                  {pos === 'left' 
                    ? t('bannerPositionLeft', lang) 
                    : pos === 'center' 
                    ? t('bannerPositionCenter', lang) 
                    : t('bannerPositionRight', lang)}
                </button>
              ))}
            </div>
          </div>

          {/* Title Placement */}
          <div>
            <label className="block text-xs font-semibold mb-2">{t('bannerTitlePlacement', lang)}</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['below', 'over'] as BannerTitlePlacement[]).map((placement) => (
                <button
                  key={placement}
                  type="button"
                  onClick={() => onChangeConfig({ ...config, titlePlacement: placement })}
                  className={`py-2 px-2 text-center rounded-xl border text-xs font-medium cursor-pointer transition-colors ${
                    config.titlePlacement === placement
                      ? 'bg-amber-500 text-black font-semibold shadow-2xs border-amber-500'
                      : `${cardAlt} ${labelColor} hover:text-inherit`
                  }`}
                >
                  {placement === 'below' ? t('bannerTitleBelow', lang) : t('bannerTitleOver', lang)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Overlay Gradient Checkbox */}
        <div className="mt-5 pt-4 border-t border-inherit flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold">{t('bannerOverlay', lang)}</span>
            <p className={`text-[11px] ${labelColor} mt-0.5`}>
              {t('bannerOverlayDesc', lang)}
            </p>
          </div>
          <input
            type="checkbox"
            checked={config.showOverlay}
            onChange={(e) => onChangeConfig({ ...config, showOverlay: e.target.checked })}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
