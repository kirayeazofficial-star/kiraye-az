"use client";
import {useEffect,useState} from "react";
export default function UnreadMessages({userId}:{userId:string}){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{if(!userId)return;let active=true,running=false;async function load(){if(running||document.hidden)return;running=true;try{const response=await fetch('/api/messages?action=unread',{cache:'no-store'}),data=await response.json();if(active)setCount(response.ok&&Number.isSafeInteger(Number(data.count))?Number(data.count):null);}catch{if(active)setCount(null);}finally{running=false;}}const wake=()=>{void load();};wake();const timer=setInterval(wake,5000);document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);window.addEventListener('online',wake);window.addEventListener('kirayeal:messages-read',wake);return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('focus',wake);window.removeEventListener('online',wake);window.removeEventListener('kirayeal:messages-read',wake);};},[userId]);
 return count&&count>0?<b className="unreadMessages" aria-label={`${count} oxunmamış mesaj`}>{count>99?'99+':count}</b>:null;
}
