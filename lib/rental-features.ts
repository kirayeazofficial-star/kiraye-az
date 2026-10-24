import { publicSupabase } from './supabase';
export async function weeklyRatesReady(){
 try{if(!publicSupabase)return false;const {data,error}=await publicSupabase.rpc('rental_features_ready').abortSignal(AbortSignal.timeout(3000));return !error&&data===true;}catch{return false;}
}
