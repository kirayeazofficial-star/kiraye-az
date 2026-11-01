"use client";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
// Filters open as a window above the page: a bottom sheet on phones, a centred dialog on wider screens.
export default function CatalogFilters({children,onClose,title,done}: {children:React.ReactNode;onClose:()=>void;title:string;done:string}) {
 const [mounted,setMounted]=useState(false);
 const panel=useRef<HTMLDivElement>(null);
 useEffect(()=>setMounted(true),[]);
 useEffect(()=>{
  if(!mounted)return;
  const previous=document.activeElement as HTMLElement|null;
  const overflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  panel.current?.focus({preventScroll:true});
  const key=(event:KeyboardEvent)=>{
   if(event.key==='Escape' && !panel.current?.querySelector('.azCalendar'))onClose();
   if(event.key!=='Tab')return;
   const fields=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not([disabled]),input:not([disabled]),select:not([disabled]),a[href]')||[]).filter(el=>el.getClientRects().length);
   const first=fields[0],last=fields[fields.length-1];
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  };
  document.addEventListener('keydown',key);
  return()=>{document.removeEventListener('keydown',key);document.body.style.overflow=overflow;previous?.focus({preventScroll:true});};
 },[onClose,mounted]);
 if(!mounted)return null;
 return createPortal(<div className="kzSheetLayer">
  <button type="button" className="kzSheetShade" aria-label="Filtrləri bağla" onClick={onClose} tabIndex={-1}/>
  <div className="kzSheet" ref={panel} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}>
   <div className="kzSheetHead"><h2>{title}</h2><button type="button" aria-label="Filtrləri bağla" onClick={onClose}><X aria-hidden="true" size={20} strokeWidth={2} /></button></div>
   <div className="kzSheetBody">{children}</div>
   <div className="kzSheetFoot"><button type="button" className="kzButton" onClick={onClose}>{done}</button></div>
  </div>
 </div>,document.body);
}
