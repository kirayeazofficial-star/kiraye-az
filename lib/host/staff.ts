import "server-only";
import {hostQuery} from "./db";
import {currentUser} from "./session";
const ownerEmail="kirayeal.az@gmail.com";
// The signed-in user when they are the site owner or a staff member, otherwise null.
export async function staffUser(){
  const user=await currentUser();if(!user)return null;
  return await isStaff(user)?user:null;
}
// Site owner, leader or admin. They place listings without limits.
export async function isStaff(user:{id:string;email:string}){
  if(user.email.toLowerCase()===ownerEmail)return true;
  const rows=await hostQuery<{role:string;staff_role:string|null}>(`select p.role,s.staff_role from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=$1`,[user.id]);
  return rows[0]?.role==="admin"&&!!rows[0]?.staff_role;
}
// Site owner or leader. Only they use paid services (VIP, Premium, bump, restore) for free,
// and may promote any listing.
export async function isLeader(user:{id:string;email:string}){
  if(user.email.toLowerCase()===ownerEmail)return true;
  const rows=await hostQuery<{role:string;staff_role:string|null}>(`select p.role,s.staff_role from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=$1`,[user.id]);
  return rows[0]?.role==="admin"&&rows[0]?.staff_role==="leader";
}
