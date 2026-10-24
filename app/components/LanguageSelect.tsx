"use client";
import { useLanguage, type Language } from "./LanguageProvider";
const languages: {value: Language; label: string; name: string}[] = [
  {value: "az", label: "AZ", name: "Azərbaycanca"},
  {value: "ru", label: "RU", name: "Русский"},
  {value: "en", label: "EN", name: "English"},
];
export default function LanguageSelect() {
  const {language, setLanguage} = useLanguage();
  return <div className="languageSelect" role="group" aria-label="Dil seçimi">
    {languages.map(item => <button key={item.value} type="button" aria-label={item.name}
      aria-pressed={language === item.value} onClick={() => setLanguage(item.value)}>{item.label}</button>)}
  </div>;
}
