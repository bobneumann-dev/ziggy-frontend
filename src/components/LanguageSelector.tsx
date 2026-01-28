import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check } from 'lucide-react';
import { supportedLanguages, changeLanguage as changeLang } from '../i18n/config';

export default function LanguageSelector() {
  const { i18n, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = supportedLanguages.find((lang) => lang.code === i18n.language) || supportedLanguages[0];

  const handleChangeLanguage = (langCode: string) => {
    changeLang(langCode);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-all duration-200 border border-white/20"
      >
        <Globe className="w-4 h-4 text-white" />
        <span className="text-sm font-medium text-white">{currentLanguage.flag}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 glass-card z-20 py-2">
            <div className="px-4 py-2 border-b border-gray-200">
              <p className="text-xs font-semibold text-gray-600 uppercase">
                {t('language.select')}
              </p>
            </div>
            {supportedLanguages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleChangeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-4 py-2 text-sm transition-colors ${
                  i18n.language === lang.code
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="font-medium">{lang.name}</span>
                </div>
                {i18n.language === lang.code && (
                  <Check className="w-4 h-4 text-indigo-600" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
