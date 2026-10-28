"use client";
import {FormEvent,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";import Header from "../components/Header";import Footer from "../components/Footer";import {publicDate} from "../../lib/public-date";
import UserAvatar from "../components/UserAvatar";
type Thread={id:string;listing_id:string;listing_title:string;listing_image?:string|null;peer_name:string;peer_avatar?:string|null;peer_no:number;listing_active:boolean;blocked:boolean;blocked_by_me:boolean;last_message_at?:string;preview?:string;unread?:number};type Message={id:number;author_id:string;body:string;created_at:string};
async function api(action:string,data:Record<string,unknown>={}){const response=await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})}),body=await response.json();if(!response.ok)throw new Error(body.error||'MESSAGE_FAILED');return body;}
function explain(code:string){return code==='OWN_LISTING'?'Öz elanına mesaj yazmaq olmaz. Elanı kabinetdən idarə et.':code==='BLOCKED'?'Bu yazışmada mesaj göndərilməsi bloklanıb.':code==='RATE_LIMIT'?'Çox tez mesaj göndərirsən. Bir az gözlə.':'Əməliyyat baş tutmadı. Yenidən yoxla.';}
export default function MessagesPanel(){
 const [user,setUser]=useState(''),[ready,setReady]=useState(false),[inboxLoading,setInboxLoading]=useState(false),[threads,setThreads]=useState<Thread[]>([]),[thread,setThread]=useState<Thread|null>(null),[messages,setMessages]=useState<Message[]>([]),[listing,setListing]=useState(''),[text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const bottom=useRef<HTMLDivElement>(null);
 const inbox=useCallback(async()=>{setInboxLoading(true);try{const response=await fetch('/api/messages?action=inbox',{cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error(data.error||'MESSAGES_UNAVAILABLE');setThreads(data.items||[]);setError('');}catch{setError('Mesajları yükləmək mümkün olmadı. Bağlantını yoxlayıb yenidən cəhd et.');}finally{setInboxLoading(false);}},[]);
 const open=useCallback(async(item:Thread)=>{setThread(item);setListing('');setError('');try{const response=await fetch(`/api/messages?action=messages&thread=${encodeURIComponent(item.id)}`,{cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error();setMessages(data.items||[]);const last=data.items?.at(-1);if(last)void api('read',{thread:item.id,message:last.id});}catch{setError('Yazışmanı açmaq mümkün olmadı. Yenidən yoxla.');}},[]);
 useEffect(()=>{const wanted=new URLSearchParams(location.search).get('listing')||'';setListing(wanted);if(wanted)fetch(`/api/listing-info?id=${encodeURIComponent(wanted)}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d&&d.mine){location.replace(`/listings/${wanted}`);}}).catch(()=>{});fetch('/api/auth/host',{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error();setUser(data.user?.id||'');}).catch(()=>setError('Hesab məlumatı yoxlanılmadı. Səhifəni yenilə.')).finally(()=>setReady(true));},[]);useEffect(()=>{if(!user)return;void inbox();const timer=setInterval(inbox,15000);return()=>clearInterval(timer);},[user,inbox]);useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[messages]);
 async function send(event:FormEvent){event.preventDefault();if(busy||!text.trim())return;setBusy(true);setError('');try{if(thread){const sent=await api('send',{thread:thread.id,body:text});setMessages(old=>[...old,sent]);}else{const started=await api('start',{listing,body:text});await inbox();const response=await fetch(`/api/messages?action=thread&thread=${started.thread}`,{cache:'no-store'}),data=await response.json();if(response.ok)await open(data.item);}setText('');}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
 async function block(){if(!thread||busy)return;setBusy(true);try{await api('block',{thread:thread.id,block:!thread.blocked_by_me});const response=await fetch(`/api/messages?action=thread&thread=${thread.id}`,{cache:'no-store'}),data=await response.json();if(response.ok)setThread(data.item);await inbox();}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
 const time=(value:string)=>new Intl.DateTimeFormat('az-AZ',{timeZone:'Asia/Baku',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
 const day=(value:string)=>publicDate(value).split(',')[0];
 const conversationOpen=!!(thread||listing);
 return <><Header/><main className={`kzMessages${conversationOpen?' hasConversation':''}`}>
  {!ready?<p className="kzMessagesState" role="status">Hesab yoxlanılır…</p>:!user?<div className="kzMessagesState"><h1>Mesajlar</h1><p>Yazışmalar yalnız hesab sahibi üçün görünür.</p><Link className="kzButton" href="/login?next=%2Fmessages">Daxil ol</Link></div>:<>
   {error&&<div className="kzNotice" role="alert"><span>{error}</span><button type="button" className="kzLinkButton" onClick={()=>void inbox()}>Yenidən yoxla</button></div>}
   <div className="kzChat">
    <aside className="kzChatList" aria-label="Söhbətlər">
     <div className="kzChatListHead"><h1>Mesajlar</h1>{!!threads.length&&<span>{threads.length}</span>}</div>
     {inboxLoading&&!threads.length?<p className="kzChatHint" role="status">Söhbətlər yüklənir…</p>:!threads.length?<div className="kzChatEmpty"><svg aria-hidden="true" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"><path d="M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-4.5 3.5V17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/></svg><strong>Hələ söhbət yoxdur</strong><p>Bəyəndiyin elanda “Mesaj yaz” düyməsini bas.</p></div>:threads.map(item=><button type="button" key={item.id} className="kzChatItem" aria-pressed={thread?.id===item.id} onClick={()=>void open(item)}>
      <span className="kzChatThumb">{item.listing_image?<img src={item.listing_image} alt=""/>:<UserAvatar src={item.peer_avatar} name={item.peer_name}/>}<UserAvatar src={item.peer_avatar} name={item.peer_name} className="kzChatPeer"/></span>
      <span className="kzChatText"><span className="kzChatTop"><strong>{item.peer_name}</strong>{item.last_message_at&&<time>{publicDate(item.last_message_at).replace('Bu gün, ','')}</time>}</span><span className="kzChatListing">{item.listing_title}</span><span className="kzChatBottom"><small>{item.preview||'Yeni söhbət'}</small>{!!item.unread&&<b>{item.unread}</b>}</span></span>
     </button>)}
    </aside>
    <section className="kzChatBody">
     {!conversationOpen?<div className="kzChatEmpty"><svg aria-hidden="true" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M6 4h12a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3h-6l-4.5 3.5V17H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3z"/></svg><strong>Söhbət seç</strong><p>Soldakı siyahıdan yazışmanı aç.</p></div>:<>
      <header className="kzChatHead">
       <button type="button" className="kzChatBack" aria-label="Söhbətlərə qayıt" onClick={()=>{setThread(null);setListing('');setMessages([]);}}><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="m15 5-7 7 7 7"/></svg></button>
       {thread?<>
        <UserAvatar src={thread.peer_avatar} name={thread.peer_name}/>
        <div className="kzChatWho"><strong>{thread.peer_name}</strong>{thread.listing_active?<Link href={`/listings/${thread.listing_id}`}>{thread.listing_title}</Link>:<span>{thread.listing_title} · aktiv deyil</span>}</div>
        {thread.listing_image&&<Link className="kzChatListingThumb" href={thread.listing_active?`/listings/${thread.listing_id}`:'#'} aria-label="Elana bax"><img src={thread.listing_image} alt=""/></Link>}
        <button type="button" className="kzChatBlock" disabled={busy} onClick={()=>void block()}>{thread.blocked_by_me?'Bloku götür':'Blokla'}</button>
       </>:<div className="kzChatWho"><strong>Elan sahibinə mesaj</strong><span>İlk mesajını aşağıda yaz.</span></div>}
      </header>
      <div className="kzChatHistory">
       {messages.map((item,index)=><div key={item.id} className="kzChatRow">
        {(index===0||day(messages[index-1].created_at)!==day(item.created_at))&&<p className="kzChatDay">{day(item.created_at)}</p>}
        <article className={item.author_id===user?'kzBubble own':'kzBubble'}><p>{item.body}</p><time>{time(item.created_at)}</time></article>
       </div>)}
       <div ref={bottom}/>
      </div>
      {thread?.blocked?<p className="kzChatBlocked">Bu yazışmada mesaj göndərilməsi bloklanıb.</p>:<form className="kzComposer" onSubmit={send}>
       <label className="srOnly" htmlFor="chat-body">Mesaj</label>
       <textarea id="chat-body" value={text} maxLength={3000} rows={1} required onChange={e=>setText(e.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&window.matchMedia('(min-width:768px)').matches){event.preventDefault();event.currentTarget.form?.requestSubmit();}}} placeholder="Mesaj yaz…"/>
       <button type="submit" aria-label="Göndər" disabled={busy||!text.trim()}><svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M3.4 20.4 21 12 3.4 3.6 3.3 10l12.6 2-12.6 2z"/></svg></button>
      </form>}
     </>}
    </section>
   </div>
  </>}
 </main><Footer/></>;
}
