"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
export default function UnreadMessages({userId}:{userId:string}){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{if(!supabase||!userId)return;let active=true,running=false;async function load(){if(running||document.hidden)return;running=true;try{const {data,error}=await supabase!.rpc('chat_unread_count');if(active)setCount(!error&&Number.isSafeInteger(Number(data))?Number(data):null);}catch{if(active)setCount(null);}finally{running=false;}}const wake=()=>{void load();};wake();const timer=setInterval(wake,5000);document.addEventListener('visibilitychange',wake);window.addEventListener('focus',wake);window.addEventListener('online',wake);window.addEventListener('kirayeal:messages-read',wake);return()=>{active=false;clearInterval(timer);document.removeEventListener('visibilitychange',wake);window.removeEventListener('focus',wake);window.removeEventListener('online',wake);window.removeEventListener('kirayeal:messages-read',wake);};},[userId]);
 return count&&count>0?<b className="unreadMessages" aria-label={`${count} oxunmamış mesaj`}>{count>99?'99+':count}</b>:null;
}
