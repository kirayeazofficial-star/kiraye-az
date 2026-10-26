"use client";
import {useEffect,useState} from "react";
import {supabase} from "../../lib/supabase";
export default function UnreadMessages({userId}:{userId:string}){
 const [count,setCount]=useState<number|null>(null);
 useEffect(()=>{if(!supabase||!userId)return;let active=true,running=false;async function load(){if(running||document.hidden)return;running=true;const {data,error}=await supabase!.rpc('chat_unread_count');running=false;if(active)setCount(!error&&Number.isSafeInteger(Number(data))?Number(data):null);}void load();const timer=setInterval(load,15000);return()=>{active=false;clearInterval(timer);};},[userId]);
 return count&&count>0?<b className="unreadMessages" aria-label={`${count} oxunmamış mesaj`}>{count>99?'99+':count}</b>:null;
}
