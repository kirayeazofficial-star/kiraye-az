"use client";
import { useLanguage } from "./LanguageProvider";
export default function LanguageSelect({toggle=false}:{toggle?:boolean}) {
 const {language,setLanguage}=useLanguage();
 if(toggle)return <div className="languageSelect languageToggle"><button type="button" translate="no" aria-label={language==="ru"?"Azərbaycanca":"Русский"} lang={language==="ru"?"az":"ru"} onClick={()=>setLanguage(language==="ru"?"az":"ru")}>{language==="ru"?"AZ":"RU"}</button></div>;
 return <div className="languageSelect" role="group" aria-label="Dil seçimi">
  <button type="button" aria-label="Azərbaycanca" aria-pressed={language==="az"} onClick={()=>setLanguage("az")}>AZ</button>
  <button type="button" aria-label="Русский" aria-pressed={language==="ru"} onClick={()=>setLanguage("ru")}>RU</button>
 </div>;
}
