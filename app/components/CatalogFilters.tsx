"use client";
import { useEffect, useRef, useState } from "react";
export default function CatalogFilters({children,onClose,title,done}: {children:React.ReactNode;onClose:()=>void;title:string;done:string}) {
 const [mobile,setMobile]=useState(false);
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>{const media=matchMedia('(max-width:720px)');const update=()=>setMobile(media.matches);update();media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;
  if(mobile){ document.body.style.overflow='hidden'; panel.current?.querySelector<HTMLButtonElement>('button')?.focus(); }
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape' && !panel.current?.querySelector('.azCalendar'))onClose();
   if(event.key!=='Tab'||!mobile)return;
   const fields=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')||[]).filter(el=>el.getClientRects().length);
   const first=fields[0],last=fields[fields.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);if(mobile){document.body.style.overflow=overflow;previous?.focus();}};
 },[onClose,mobile]);
 return <div className="catalogFilterLayer"><button className="catalogFilterShade" aria-label="Filtrləri bağla" onClick={onClose} tabIndex={-1}/><div className="catalogFilterPanel" ref={panel} role={mobile ? "dialog" : undefined} aria-modal={mobile ? true : undefined} aria-label={mobile ? title : undefined}>
 <div className="catalogFilterHeading"><h2>{title}</h2><button type="button" aria-label="Filtrləri bağla" onClick={onClose}>×</button></div>
 {children}<button type="button" className="add catalogFilterDone" onClick={onClose}>{done}</button>
 </div></div>;
}
