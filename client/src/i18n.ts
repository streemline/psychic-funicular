import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import ru from './locales/ru.json';
import uk from './locales/uk.json';
import cs from './locales/cs.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ru: { translation: ru },
      uk: { translation: uk },
      cs: { translation: cs },
    },
    fallbackLng: 'ru',
    interpolation: {
      escapeValue: false,
    },
    supportedLngs: ['ru', 'uk', 'cs'],
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
  });

export default i18n;
