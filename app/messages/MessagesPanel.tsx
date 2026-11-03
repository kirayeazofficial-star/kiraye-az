"use client";
import { dateFormat } from "../../lib/date-format";
import { ChevronLeft, MessageSquareText, MoreHorizontal, SendHorizontal } from "lucide-react";
import { sized } from "../../lib/image-size";
import {FormEvent,useCallback,useEffect,useRef,useState} from "react";
import Link from "next/link";import Header from "../components/Header";import Footer from "../components/Footer";import {publicDate} from "../../lib/public-date";
import UserAvatar from "../components/UserAvatar";
import EmptyArt from "../components/EmptyArt";
import Feedback from "../components/Feedback";
type Thread={id:string;listing_id:string;listing_title:string;listing_image?:string|null;peer_name:string;peer_avatar?:string|null;is_buyer?:boolean;peer_no:number;listing_active:boolean;blocked:boolean;blocked_by_me:boolean;last_message_at?:string;preview?:string;unread?:number};type Message={id:number;author_id:string;body:string;created_at:string};
async function api(action:string,data:Record<string,unknown>={}){const response=await fetch('/api/messages',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,...data})}),body=await response.json();if(!response.ok)throw new Error(body.error||'MESSAGE_FAILED');return body;}
function explain(code:string){return code==='OWN_LISTING'?'Öz elanınıza mesaj göndərmək mümkün deyil. Elanı kabinetinizdən idarə edə bilərsiniz.':code==='BLOCKED'?'Bu yazışmada mesaj göndərilməsi bloklanıb.':code==='RATE_LIMIT'?'Mesajlar çox qısa fasilə ilə göndərilir. Bir qədər gözləyib yenidən cəhd edin.':'Əməliyyat baş tutmadı. Yenidən yoxlayın.';}
export default function MessagesPanel(){
 const [user,setUser]=useState(''),[ready,setReady]=useState(false),[inboxLoading,setInboxLoading]=useState(false),[threads,setThreads]=useState<Thread[]>([]),[thread,setThread]=useState<Thread|null>(null),[messages,setMessages]=useState<Message[]>([]),[listing,setListing]=useState(''),[text,setText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);const bottom=useRef<HTMLDivElement>(null),composer=useRef<HTMLTextAreaElement>(null),openSequence=useRef(0);const [conversationLoading,setConversationLoading]=useState(false);const [tab,setTab]=useState<'all'|'buy'|'sell'>('all');
 const inbox=useCallback(async()=>{setInboxLoading(true);try{const response=await fetch('/api/messages?action=inbox',{cache:'no-store'}),data=await response.json();if(!response.ok)throw new Error(data.error||'MESSAGES_UNAVAILABLE');setThreads(data.items||[]);setError('');}catch{setError('Mesajları yükləmək mümkün olmadı. Bağlantını yoxlayıb yenidən cəhd edin.');}finally{setInboxLoading(false);}},[]);
 const open=useCallback(async(item:Thread)=>{const sequence=++openSequence.current;setThread(item);setListing('');setMessages([]);setError('');setConversationLoading(true);try{const response=await fetch(`/api/messages?action=messages&thread=${encodeURIComponent(item.id)}`,{cache:'no-store'}),data=await response.json();if(sequence!==openSequence.current)return;if(!response.ok)throw new Error();setMessages(data.items||[]);const last=data.items?.at(-1);if(last)void api('read',{thread:item.id,message:last.id}).catch(()=>{});}catch{if(sequence===openSequence.current)setError('Yazışmanı açmaq mümkün olmadı. Yenidən cəhd edin.');}finally{if(sequence===openSequence.current)setConversationLoading(false);}},[]);
 useEffect(()=>()=>{openSequence.current++;},[]);
 useEffect(()=>{const resize=()=>{const node=composer.current;if(!node)return;node.style.height='auto';node.style.height=`${Math.min(140,Math.max(44,node.scrollHeight))}px`;};resize();window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);},[text,thread?.id,listing]);
 useEffect(()=>{const wanted=new URLSearchParams(location.search).get('listing')||'';setListing(wanted);if(wanted)fetch(`/api/listing-info?id=${encodeURIComponent(wanted)}`,{cache:'no-store'}).then(r=>r.json()).then(d=>{if(d&&d.mine){location.replace(`/listings/${wanted}`);}}).catch(()=>{});fetch('/api/auth/host',{cache:'no-store'}).then(async r=>{const data=await r.json();if(!r.ok)throw new Error();setUser(data.user?.id||'');}).catch(()=>setError('Hesab məlumatları yoxlanılmadı. Səhifəni yeniləyin.')).finally(()=>setReady(true));},[]);useEffect(()=>{if(!user)return;void inbox();const timer=setInterval(inbox,15000);const refresh=()=>{void inbox();};window.addEventListener('kiraye:refresh',refresh);return()=>{clearInterval(timer);window.removeEventListener('kiraye:refresh',refresh);};},[user,inbox]);useEffect(()=>{bottom.current?.scrollIntoView({block:'nearest'});},[messages]);
 async function send(event:FormEvent){event.preventDefault();if(busy||conversationLoading||!text.trim())return;setBusy(true);setError('');try{if(thread){const sent=await api('send',{thread:thread.id,body:text});setMessages(old=>[...old,sent]);}else{const started=await api('start',{listing,body:text});await inbox();const response=await fetch(`/api/messages?action=thread&thread=${started.thread}`,{cache:'no-store'}),data=await response.json();if(response.ok)await open(data.item);}setText('');}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
 async function block(){if(!thread||busy)return;setBusy(true);try{await api('block',{thread:thread.id,block:!thread.blocked_by_me});const response=await fetch(`/api/messages?action=thread&thread=${thread.id}`,{cache:'no-store'}),data=await response.json();if(response.ok)setThread(data.item);await inbox();}catch(e){setError(explain(e instanceof Error?e.message:''));}finally{setBusy(false);}}
 const moreMenu=useRef<HTMLDetailsElement>(null);
 useEffect(()=>{const close=(event:Event)=>{const menu=moreMenu.current;if(menu?.open&&!menu.contains(event.target as Node))menu.open=false;};document.addEventListener('pointerdown',close);return()=>document.removeEventListener('pointerdown',close);},[]);
 const time=(value:string)=>dateFormat('az-AZ',{timeZone:'Asia/Baku',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));
 const day=(value:string)=>publicDate(value).split(',')[0];
 // Month names written out: browsers often lack Azerbaijani month names and print "M11 1".
 const months=['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek'];
 const shortTime=(value:string)=>{if(day(value)===day(new Date().toISOString()))return time(value);const parts=Object.fromEntries(dateFormat('en-GB',{timeZone:'Asia/Baku',day:'numeric',month:'numeric'}).formatToParts(new Date(value)).map(part=>[part.type,part.value]));return `${Number(parts.day)} ${months[Number(parts.month)-1]}`;};
 const conversationOpen=!!(thread||listing);
 return <><Header/><main className={`kzMessages${conversationOpen?' hasConversation':''}`}>
  {!ready?<p className="kzMessagesState" role="status">Hesab yoxlanılır…</p>:!user?<div className="kzMessagesState"><span className="kzChatWelcomeIcon"><MessageSquareText aria-hidden="true" size={30} strokeWidth={1.7}/></span><h1>Mesajlar</h1><p>Yazışmalar yalnız hesab sahibi üçün görünür.</p>{error&&<Feedback>{error}</Feedback>}<Link className="kzButton" href="/login?next=%2Fmessages">Daxil ol</Link></div>:<>
   {error&&<Feedback>{error}<button type="button" className="kzFeedbackRetry" onClick={()=>void inbox()}>Yazışma siyahısını yenilə</button></Feedback>}
   <div className="kzChat">
    <aside className="kzChatList" aria-label="Söhbətlər">
     <div className="kzChatListHead"><div><h1>Mesajlar</h1><p>Elanlar üzrə yazışmalarınız</p></div>{!!threads.length&&<span aria-label="Yazışmaların sayı">{threads.length}</span>}</div>
     <div className="kzChatTabs" role="group" aria-label="Söhbət növü">{([['all','Hamısı'],['buy','Götürürəm'],['sell','Verirəm']] as const).map(([key,label])=><button key={key} type="button" aria-pressed={tab===key} onClick={()=>setTab(key)}>{label}</button>)}</div>
     {inboxLoading&&!threads.length?<p className="kzChatHint" role="status">Söhbətlər yüklənir…</p>:!threads.filter(item=>tab==='all'||(tab==='buy')===!!item.is_buyer).length?<div className="kzChatEmpty"><EmptyArt kind="chat" /><strong>{threads.length?"Bu bölmədə yazışma yoxdur":"Hələ yazışmanız yoxdur"}</strong><p>{threads.length?"Digər yazışmaları görmək üçün “Hamısı” bölməsini seçin.":"Elan səhifəsində “Mesaj yaz” düyməsi ilə elan sahibi ilə əlaqə saxlayın."}</p>{!threads.length&&<Link className="kzChatBrowse" href="/#elanlar">Elanlara bax</Link>}</div>:threads.filter(item=>tab==='all'||(tab==='buy')===!!item.is_buyer).map(item=><button type="button" key={item.id} className="kzChatItem" aria-pressed={thread?.id===item.id} onClick={()=>void open(item)}>
      <span className="kzChatThumb">{item.listing_image?<img src={sized(item.listing_image)} alt="" loading="lazy" decoding="async"/>:<UserAvatar src={item.peer_avatar} name={item.peer_name}/>}<UserAvatar src={item.peer_avatar} name={item.peer_name} className="kzChatPeer"/></span>
      <span className="kzChatText"><span className="kzChatTop"><strong translate="no">{item.peer_name}</strong>{item.last_message_at&&<time dateTime={item.last_message_at} title={publicDate(item.last_message_at)}>{shortTime(item.last_message_at)}</time>}</span><span className="kzChatListing" translate="no">{item.listing_title}</span><span className="kzChatBottom"><small translate="no">{item.preview||'Yeni söhbət'}</small>{!!item.unread&&<b>{item.unread}</b>}</span></span>
     </button>)}
    </aside>
    <section className="kzChatBody">
     {!conversationOpen?<div className="kzChatEmpty"><span className="kzChatWelcomeIcon"><MessageSquareText aria-hidden="true" size={30} strokeWidth={1.7}/></span><strong>Yazışma seçin</strong><p>Siyahıdan yazışmanı seçərək mesajlara baxın.</p></div>:<>
      <header className="kzChatHead">
       <button type="button" className="kzChatBack" aria-label="Söhbətlərə qayıt" onClick={()=>{openSequence.current++;setConversationLoading(false);setThread(null);setListing('');setMessages([]);setError('');}}><ChevronLeft aria-hidden="true" size={24} strokeWidth={2} /></button>
       {thread?<>
        <UserAvatar src={thread.peer_avatar} name={thread.peer_name}/>
        <div className="kzChatWho"><strong translate="no">{thread.peer_name}</strong>{thread.listing_active?<Link href={`/listings/${thread.listing_id}`}>{thread.listing_title}</Link>:<span>{thread.listing_title} · aktiv deyil</span>}</div>
        {thread.listing_image&&<Link className="kzChatListingThumb" href={thread.listing_active?`/listings/${thread.listing_id}`:'#'} aria-label="Elana bax"><img src={sized(thread.listing_image)} alt=""/></Link>}
        <details className="kzChatMore" ref={moreMenu}>
         <summary aria-label="Yazışma seçimləri"><MoreHorizontal aria-hidden="true" size={20} strokeWidth={2} /></summary>
         <div className="kzChatMenu" role="menu">
          {thread.listing_active&&<Link role="menuitem" href={`/listings/${thread.listing_id}`}>Elana bax</Link>}
          <button type="button" role="menuitem" className={thread.blocked_by_me?'':'danger'} disabled={busy} onClick={()=>{if(moreMenu.current)moreMenu.current.open=false;void block();}}>{thread.blocked_by_me?'Bloku götür':'İstifadəçini blokla'}</button>
         </div>
        </details>
       </>:<div className="kzChatWho"><strong>Elan sahibinə mesaj</strong><span>Mesajınızı aşağıdakı xanaya daxil edin.</span></div>}
      </header>
      <div className="kzChatHistory" aria-busy={conversationLoading}>
       {conversationLoading&&<p className="kzChatHint" role="status">Yazışma yüklənir…</p>}
       {messages.map((item,index)=><div key={item.id} className="kzChatRow">
        {(index===0||day(messages[index-1].created_at)!==day(item.created_at))&&<p className="kzChatDay">{day(item.created_at)}</p>}
        <article className={item.author_id===user?'kzBubble own':'kzBubble'}><p translate="no">{item.body}</p><time dateTime={item.created_at}>{time(item.created_at)}</time></article>
       </div>)}
       <div ref={bottom}/>
      </div>
      {thread?.blocked?<p className="kzChatBlocked">Bu yazışmada mesaj göndərilməsi bloklanıb.</p>:<form className="kzComposer" onSubmit={send}>
       <label className="srOnly" htmlFor="chat-body">Mesaj</label>
       <textarea ref={composer} id="chat-body" value={text} maxLength={3000} rows={1} required onChange={e=>setText(e.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey&&!event.nativeEvent.isComposing&&window.matchMedia('(min-width:768px)').matches){event.preventDefault();event.currentTarget.form?.requestSubmit();}}} placeholder="Mesaj yaz…"/>
       <button type="submit" aria-label="Göndər" disabled={busy||conversationLoading||!text.trim()}><SendHorizontal aria-hidden="true" size={20} strokeWidth={2} /></button>
      </form>}
     </>}
    </section>
   </div>
  </>}
 </main><Footer/></>;
}
