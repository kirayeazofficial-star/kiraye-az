"use client";
import { useEffect, useId, useRef, useState } from "react";
const months = ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"];
const iso = (year:number,month:number,day:number) => `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
function parse(raw:string) {
 const value = /^\d{2}\.\d{2}\.\d{4}$/.test(raw) ? raw.split(".").reverse().join("-") : raw;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return "";
 const date = new Date(value+"T12:00:00Z");
 return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value ? value : "";
}
export default function AzerbaijaniDateInput({label,value,onChange,min,max}:{label:string;value:string;onChange:(value:string)=>void;min?:string;max?:string}) {
 const id=useId(),root=useRef<HTMLDivElement>(null);
 const typed=useRef<string | null>(null);
 const [raw,setRaw]=useState(value ? value.split("-").reverse().join(".") : "");
 const [open,setOpen]=useState(false);
 const [placement,setPlacement]=useState({left:0,above:false});
 const initial=value ? new Date(value+"T12:00:00") : new Date();
 const [month,setMonth]=useState(initial.getMonth()),[year,setYear]=useState(initial.getFullYear());
 useEffect(()=>{if(typed.current===value) typed.current=null; else setRaw(value ? value.split("-").reverse().join(".") : "");if(value){const date=new Date(value+"T12:00:00");setMonth(date.getMonth());setYear(date.getFullYear());}},[value]);
 useEffect(()=>{if(!open)return;const close=(event:PointerEvent)=>{if(!root.current?.contains(event.target as Node))setOpen(false);};document.addEventListener("pointerdown",close);return()=>document.removeEventListener("pointerdown",close);},[open]);
 useEffect(()=>{if(!open)return;const position=()=>{const rect=root.current?.getBoundingClientRect();if(!rect)return;const width=Math.min(280,window.innerWidth-40);setPlacement({left:Math.max(12,Math.min(rect.left,window.innerWidth-width-12))-rect.left,above:rect.bottom+320>window.innerHeight&&rect.top>320});};position();window.addEventListener("resize",position);window.addEventListener("scroll",position,true);return()=>{window.removeEventListener("resize",position);window.removeEventListener("scroll",position,true);};},[open,month,year]);
 const days=new Date(year,month+1,0).getDate(),offset=(new Date(year,month,1).getDay()+6)%7;
 function move(delta:number){const date=new Date(year,month+delta,1);setYear(date.getFullYear());setMonth(date.getMonth());}
 const years=Array.from(new Set([year,new Date().getFullYear()-1,...Array.from({length:8},(_,i)=>new Date().getFullYear()+i)])).sort((a,b)=>a-b);
 return <div className={`azDate${open ? " isOpen" : ""}`} ref={root} onKeyDown={event=>{if(open && event.key==="Escape"){event.stopPropagation();setOpen(false);root.current?.querySelector("input")?.focus();}}}>
  <label htmlFor={id}>{label}</label>
  <div className="azDateControl"><input id={id} aria-label={label} inputMode="numeric" placeholder="GG.AA.İİİİ" autoComplete="off" value={raw} maxLength={10} onChange={event=>{const text=event.target.value;setRaw(text);const parsed=parse(text);const next=parsed && (!min||parsed>=min)&&(!max||parsed<=max) ? parsed : "";typed.current=next;onChange(next);}} /><button type="button" aria-label={`${label} — təqvimi aç`} aria-expanded={open} onClick={()=>setOpen(!open)}>▦</button></div>
  {open && <section className="azCalendar" style={{left:placement.left,right:"auto",top:placement.above?"auto":"100%",bottom:placement.above?"100%":"auto"}} aria-label={`${label} — Azərbaycan təqvimi`}>
    <div className="azCalendarHeading"><button type="button" aria-label="Əvvəlki ay" onClick={()=>move(-1)}>‹</button><strong>{months[month]} {year}</strong><button type="button" aria-label="Növbəti ay" onClick={()=>move(1)}>›</button><button type="button" aria-label="Təqvimi bağla" onClick={()=>setOpen(false)}>×</button></div>
    <div className="azCalendarSelects"><select aria-label="Ay seç" value={month} onChange={event=>setMonth(Number(event.target.value))}>{months.map((name,i)=><option key={name} value={i}>{name}</option>)}</select><select aria-label="İl seç" value={year} onChange={event=>setYear(Number(event.target.value))}>{years.map(value=><option key={value}>{value}</option>)}</select></div>
    <div className="azCalendarDays">{["Be","Ça","Çə","Ca","Cü","Şə","Ba"].map(day=><small key={day}>{day}</small>)}{Array.from({length:offset},(_,i)=><span key={`empty-${i}`}/>)}{Array.from({length:days},(_,i)=>{const date=iso(year,month,i+1);return <button type="button" key={date} aria-label={`${i+1} ${months[month]} ${year}`} aria-pressed={value===date} disabled={!!((min&&date<min)||(max&&date>max))} onClick={()=>{typed.current=null;onChange(date);setRaw(date.split("-").reverse().join("."));setOpen(false);}}>{i+1}</button>;})}</div>
  </section>}
 </div>;
}
