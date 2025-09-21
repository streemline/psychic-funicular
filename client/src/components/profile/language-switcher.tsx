import React from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'ru', label: 'Русский' },
  { code: 'uk', label: 'Українська' },
  { code: 'cs', label: 'Čeština' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="flex items-center mb-4">
      <label htmlFor="language-select" className="mr-2 text-sm text-muted-foreground">
        Язык:
      </label>
      <select
        id="language-select"
        value={i18n.language}
        onChange={handleChange}
        className="border rounded px-2 py-1 text-sm bg-background"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
} 