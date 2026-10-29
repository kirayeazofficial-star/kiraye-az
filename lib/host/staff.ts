import "server-only";
import {hostQuery} from "./db";
import {currentUser} from "./session";
const ownerEmail="kirayeal.az@gmail.com";
// The signed-in user when they are the site owner or a staff member, otherwise null.
export async function staffUser(){
  const user=await currentUser();if(!user)return null;
  if(user.email.toLowerCase()===ownerEmail)return user;
  const rows=await hostQuery<{role:string;staff_role:string|null}>(`select p.role,s.staff_role from public.profiles p left join public.staff_members s on s.user_id=p.id where p.id=$1`,[user.id]);
  return rows[0]?.role==="admin"&&rows[0]?.staff_role?user:null;
}
