"use client";
import {useEffect,useRef} from "react";
import {createPortal} from "react-dom";
import {X} from "lucide-react";
import {categories} from "../../lib/marketplace";
import CategoryVisual from "./CategoryVisual";
import {useLanguage} from "./LanguageProvider";

export default function MobileCatalog({onClose}:{onClose:()=>void}){
 const {t}=useLanguage(),panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;
  document.body.style.overflow="hidden";panel.current?.focus({preventScroll:true});
  return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus({preventScroll:true});};
 },[]);
 return createPortal(<div className="kzCatalogOverlay" onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div id="kz-catalog" className="kzCatalogDialog" ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="mobile-catalog-title" onKeyDown={event=>{
   if(event.key==='Escape'){event.stopPropagation();onClose();}
   if(event.key==='Tab'){
    const links=panel.current?.querySelectorAll<HTMLElement>('button,a[href]');if(!links?.length)return;
    const first=links[0],last=links[links.length-1];
    if(event.shiftKey&&(document.activeElement===first||document.activeElement===panel.current)){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
   }
  }}>
   <div className="kzCatalogDialogHead"><h2 id="mobile-catalog-title">{t("Kateqoriyalar")}</h2><button type="button" aria-label={t("Bağla")} onClick={onClose}><X aria-hidden="true" size={22}/></button></div>
   <nav aria-label={t("Kateqoriyalar")}>{categories.map(item=><a key={item.id} href={`/?category=${item.id}#elanlar`}><CategoryVisual id={item.id}/><span>{t(item.name)}</span></a>)}</nav>
  </div>
 </div>,document.body);
}
