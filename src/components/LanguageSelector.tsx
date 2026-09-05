import React from 'react';
import { Language, SUPPORTED_LANGUAGES, t } from '../i18n';
import { Globe, Check, ShieldCheck, Info } from 'lucide-react';

interface LanguageSelectorProps {
  currentLanguage: Language;
  onSelectLanguage: (lang: Language) => void;
  cardBg: string;
  cardAlt: string;
  labelColor: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  cardBg,
  cardAlt,
  labelColor,
}) => {
  return (
    <div className="space-y-6 max-w-3xl">
      {/* Language Options Grid */}
      <div className={`p-6 rounded-2xl border shadow-xs ${cardBg}`}>
        <div className="flex items-center space-x-2.5 mb-1">
          <Globe className="w-5 h-5 text-amber-500" />
          <h3 className="text-base font-semibold font-heading">
            {t('languageSettingsTitle', currentLanguage)}
          </h3>
        </div>
        <p className={`text-xs mb-5 ${labelColor}`}>
          {t('languageSettingsSubtitle', currentLanguage)}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {SUPPORTED_LANGUAGES.map((langItem) => {
            const isSelected = currentLanguage === langItem.code;
            return (
              <div
                key={langItem.code}
                onClick={() => onSelectLanguage(langItem.code)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-500/5'
                    : 'border-inherit hover:border-amber-500/40 opacity-80 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl leading-none">{langItem.flag}</span>
                    <span className="font-semibold text-sm font-heading">
                      {langItem.nativeLabel}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-amber-500 text-black flex items-center justify-center">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
                <p className={`text-xs ${labelColor} leading-relaxed`}>
                  {langItem.code === 'id' 
                    ? t('langIdDesc', currentLanguage) 
                    : t('langEnDesc', currentLanguage)}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Safety Notice Card for Data Integrity */}
      <div className={`p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex items-start space-x-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold font-heading uppercase tracking-wider mb-1 flex items-center space-x-1.5 text-emerald-600 dark:text-emerald-400">
              <span>{t('safeTranslationNoticeTitle', currentLanguage)}</span>
            </h4>
            <p className={`text-xs leading-relaxed ${labelColor}`}>
              {t('safeTranslationNoticeDesc', currentLanguage)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
