import "server-only";
import {hostQuery} from "./db";
import {noticeLetter,sendLetter} from "./mailer";

// One notice per (kind, ref): returns false when it was already sent.
async function claim(userId:string|null,kind:string,ref:string){
  const rows=await hostQuery(`insert into public.notification_log(user_id,kind,ref) values($1,$2,$3) on conflict(kind,ref) do nothing returning id`,[userId,kind,ref]);
  return !!rows[0];
}

// New chat message: the other person gets a letter, at most one per conversation every 30 minutes
// and only while they have not read it; people who switched notices off get none.
export async function notifyNewMessage(threadId:string,authorId:string){
  try{
    const rows=await hostQuery<{peer:string;email:string;enabled:boolean;title:string;author:string|null}>(`select case when t.buyer_id=$2 then t.seller_id else t.buyer_id end as peer,u.email,coalesce(p.email_notifications,true) as enabled,t.listing_title as title,ap.display_name as author
      from public.chat_threads t join auth.users u on u.id=case when t.buyer_id=$2 then t.seller_id else t.buyer_id end
      left join public.profiles p on p.id=u.id left join public.profiles ap on ap.id=$2 where t.id=$1`,[threadId,authorId]);
    const row=rows[0];if(!row?.email||!row.enabled)return;
    const slot=Math.floor(Date.now()/1800000);
    if(!await claim(row.peer,"message",`${threadId}:${row.peer}:${slot}`))return;
    await sendLetter(row.email,`Yeni mesaj: ${row.title}`.slice(0,120),noticeLetter({
      heading:"Sizə yeni mesaj var",
      intro:`${row.author||"İstifadəçi"} «${row.title}» elanı ilə bağlı sizə yazdı. Cavab vermək üçün saytda mesajlar bölməsini açın.`,
      button:{text:"Mesajı oxu",href:`/messages`},
      note:"Mesajlara tez cavab vermək elanınızın daha çox maraq görməsinə kömək edir.",
    }));
  }catch(error){console.error("message notice failed:",(error as Error).message);}
}
