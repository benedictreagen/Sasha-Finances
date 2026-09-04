import React from 'react';
import { Check, Sparkles, Sun, Moon, Flower2, Leaf, Snowflake, Wine, Cloud as CloudIcon } from 'lucide-react';
import { ThemeMode } from '../types';
import { THEMES, getThemeTokens, ThemeMeta } from '../theme';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
}

const THEME_ICONS: Record<ThemeMode, React.ReactNode> = {
  light: <Sun className="w-4 h-4 text-amber-500" />,
  dark: <Moon className="w-4 h-4 text-amber-400" />,
  'cherry-blossom': <Flower2 className="w-4 h-4 text-rose-500" />,
  spring: <Leaf className="w-4 h-4 text-emerald-500" />,
  winter: <Snowflake className="w-4 h-4 text-sky-500" />,
  berry: <Wine className="w-4 h-4 text-fuchsia-400" />,
  cloud: <CloudIcon className="w-4 h-4 text-indigo-500" />,
};

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
}) => {
  const activeTokens = getThemeTokens(currentTheme);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <div className="flex items-center space-x-2">
          <h3 className="text-base font-semibold font-heading">Theme & Aesthetics</h3>
          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${activeTokens.accentBadge}`}>
            {THEMES.find((t) => t.id === currentTheme)?.name || 'Custom'} Active
          </span>
        </div>
        <p className={`text-xs mt-1 ${activeTokens.labelColor}`}>
          Select an editorial aesthetic for Sasha’s Financial workspace. Colors apply globally across dashboards, ledgers, and modals.
        </p>
      </div>

      {/* Grid of 7 Themes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {THEMES.map((themeItem: ThemeMeta) => {
          const isSelected = currentTheme === themeItem.id;
          const preview = themeItem.preview;

          return (
            <button
              type="button"
              key={themeItem.id}
              onClick={() => onSelectTheme(themeItem.id)}
              className={`text-left p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
                isSelected
                  ? 'ring-2 ring-offset-2 ring-offset-black/5 dark:ring-offset-black/40 shadow-md'
                  : 'hover:border-black/20 dark:hover:border-white/20 opacity-80 hover:opacity-100 hover:shadow-xs'
              }`}
              style={{
                backgroundColor: preview.surface,
                borderColor: isSelected ? preview.accent : preview.border,
                color: preview.text,
              }}
            >
              {/* Top Row: Icon, Name & Type Badge */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center shadow-2xs"
                      style={{
                        backgroundColor: preview.bg,
                        border: `1px solid ${preview.border}`,
                      }}
                    >
                      {THEME_ICONS[themeItem.id]}
                    </div>
                    <div>
                      <div className="font-semibold text-sm leading-tight flex items-center gap-1.5">
                        <span>{themeItem.name}</span>
                        {isSelected && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: preview.accent }}
                          />
                        )}
                      </div>
                      <span
                        className="text-[10px] uppercase font-bold tracking-wider opacity-60"
                        style={{ color: preview.text }}
                      >
                        {themeItem.type} tone
                      </span>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center transition-transform"
                    style={{
                      backgroundColor: isSelected ? preview.accent : 'transparent',
                      border: `1.5px solid ${isSelected ? preview.accent : preview.border}`,
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </div>

                {/* Tagline */}
                <p
                  className="text-xs leading-relaxed mb-4 opacity-75 line-clamp-2"
                  style={{ color: preview.text }}
                >
                  {themeItem.tagline}
                </p>
              </div>

              {/* Bottom: Color Palette Swatches Preview */}
              <div
                className="p-2 rounded-xl flex items-center justify-between"
                style={{
                  backgroundColor: preview.bg,
                  border: `1px solid ${preview.border}`,
                }}
              >
                <div className="flex items-center space-x-1.5">
                  <span
                    className="w-4 h-4 rounded-full shadow-xs border border-black/10"
                    style={{ backgroundColor: preview.bg }}
                    title="Background"
                  />
                  <span
                    className="w-4 h-4 rounded-full shadow-xs border border-black/10"
                    style={{ backgroundColor: preview.surface }}
                    title="Card Surface"
                  />
                  <span
                    className="w-4 h-4 rounded-full shadow-xs border border-black/10"
                    style={{ backgroundColor: preview.accent }}
                    title="Accent Highlight"
                  />
                  <span
                    className="w-4 h-4 rounded-full shadow-xs border border-black/10"
                    style={{ backgroundColor: preview.text }}
                    title="Typography"
                  />
                </div>
                <span
                  className="text-[10px] font-mono font-medium opacity-60"
                  style={{ color: preview.text }}
                >
                  {preview.accent}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Live Component Preview Sandbox */}
      <div className={`p-5 rounded-2xl border shadow-xs transition-colors ${activeTokens.cardBg}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className={`w-4 h-4 ${activeTokens.accentText}`} />
            <h4 className="text-xs font-bold uppercase tracking-wider font-heading">
              Live Global Token Preview
            </h4>
          </div>
          <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${activeTokens.accentBadge}`}>
            Applied Globally
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Mock KPI */}
          <div className={`p-3.5 rounded-xl border ${activeTokens.cardAlt}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${activeTokens.labelColor}`}>
              Sample Metric
            </span>
            <div className="text-sm font-bold mt-0.5 font-heading">
              Rp 45.000.000
            </div>
            <span className={`text-[10px] ${activeTokens.accentText} font-medium`}>
              +12.4% Net Savings Rate
            </span>
          </div>

          {/* Mock Ledger Row */}
          <div className={`p-3.5 rounded-xl border flex items-center justify-between ${activeTokens.cardAlt}`}>
            <div>
              <div className="text-xs font-semibold">Matcha Oat Latte</div>
              <div className={`text-[10px] ${activeTokens.labelColor}`}>BCA • Food & Beverage</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-rose-500">-Rp 45.000</div>
              <div className={`text-[10px] ${activeTokens.labelColor}`}>Today</div>
            </div>
          </div>

          {/* Mock Action */}
          <div className={`p-3.5 rounded-xl border flex flex-col justify-between ${activeTokens.cardAlt}`}>
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${activeTokens.labelColor}`}>
              Interactive Control
            </span>
            <button
              type="button"
              className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold cursor-default transition-transform ${activeTokens.accentColor}`}
            >
              Primary Button
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
