"use client";
import { useLanguage, type Language } from "./LanguageProvider";
export default function LanguageSelect() {
 const {language,setLanguage} = useLanguage();
 return <label className="languageSelect"><span>DİL*</span><select aria-label="Dil seçimi" value={language} onChange={event=>setLanguage(event.target.value as Language)}><option value="az">AZ</option><option value="ru">RU</option><option value="en">EN</option></select></label>;
}
