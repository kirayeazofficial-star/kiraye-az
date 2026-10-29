"use client";
import { ChevronLeft } from "lucide-react";
import {FormEvent,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import {normalizePhone} from '../../lib/rental-details';
import {squareAvatar} from '../../lib/avatar-image';
import UserAvatar from './UserAvatar';
import PhoneInput from './PhoneInput';
type Profile={profile_no:number;name:string;phone:string;email:string;role:string;staff_role:string|null;phone_changes:number;email_changes:number;phone_remaining:number;email_remaining:number;phone_verified:false;pending_email:string|null;created_at?:string|null;avatar_url?:string|null};
const azMonths=['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'];
function azDate(iso:string){const d=new Date(iso);return`${d.getDate()} ${azMonths[d.getMonth()]} ${d.getFullYear()}`}
const messages:Record<string,string>={reauth_failed:'Cari şifrə düzgün deyil.',recent_login_required:'Telefon və ya e-poçt dəyişikliyi üçün cari şifrənizi yazın.',phone_limit_reached:'Telefon üçün üç dəyişiklik haqqı bitib. Dəstəyə müraciət edin.',email_limit_reached:'E-poçt üçün üç dəyişiklik haqqı bitib. Dəstəyə müraciət edin.',invalid_profile:'Ad-soyad və düzgün Azərbaycan telefon nömrəsi tələb olunur.',invalid_email:'Düzgün e-poçt ünvanı yazın.',rate_limited:'Çox cəhd edilib. 15 dəqiqə sonra yenidən yoxlayın.',mail_delivery_failed:'Təsdiq məktubu göndərilmədi. E-poçt dəyişdirilməyib; göndəriş xidməti yoxlanmalıdır.',email_change_failed:'E-poçt dəyişikliyi alınmadı. Ünvanı və təsdiq imkanını yoxlayın.',invalid_code:'Kod yanlışdır və ya vaxtı bitib.',email_taken:'Bu e-poçt artıq istifadə olunur.',same_email:'Bu, hazırkı e-poçtundur.',email_change_not_started:'E-poçt dəyişikliyi başlamadı. Ünvanı yoxlayın və ya dəstəyə müraciət edin.',provider_reauth_required:'Bu hesab üçün giriş provayderi ilə yenidən təsdiq tələb olunur.',sign_in_required:'Hesabınıza yenidən daxil olun.',profile_unavailable:'Profil xidməti hazır deyil. Heç bir uğur təsdiqlənmədi.'};
export default function ProfileSettings(){
 const [profile,setProfile]=useState<Profile|null>(null),[name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[emailPassword,setEmailPassword]=useState(''),[loading,setLoading]=useState(true),[signedIn,setSignedIn]=useState(false),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState('');
 const identity=useRef('');const [emailStep,setEmailStep]=useState<0|1|2>(0),[emailCode,setEmailCode]=useState('');
 function accept(value:Profile){setProfile(value);setName(value.name||'');setPhone(value.phone||'');setEmail(value.pending_email||value.email||'');}
 useEffect(()=>{let active=true;
  async function load(){try{const account=await fetch('/api/auth/host',{cache:'no-store'}).then(r=>r.json());if(!active)return;if(!account.user){setSignedIn(false);return;}identity.current=account.user.id;setSignedIn(true);const response=await fetch('/api/account/profile',{cache:'no-store'});const data=await response.json();if(!active||identity.current!==account.user.id)return;if(!response.ok||!data.profile)throw Error();accept(data.profile);}catch{if(active)setError('Profil məlumatları yüklənmədi. Səhifəni yeniləyin.');}finally{if(active)setLoading(false);}}
  void load();return()=>{active=false;};
 },[]);
 const photoInput=useRef<HTMLInputElement>(null);
 async function changePhoto(file:File|undefined){
  if(!file||busy)return;setBusy('photo');setError('');setNotice('');
  try{if(!file.type.startsWith('image/'))throw new Error('Şəkil faylı seçin.');const form=new FormData();form.append('file',await squareAvatar(file),'avatar.jpg');const response=await fetch('/api/account/avatar',{method:'POST',body:form});const data=await response.json();if(!response.ok||!data.avatar_url)throw new Error('Şəkil yüklənmədi. Yenidən yoxlayın.');setProfile(current=>current?{...current,avatar_url:data.avatar_url}:current);setNotice('Profil şəkli yeniləndi.');window.dispatchEvent(new Event('kiraye:profile'));}
  catch(problem){setError(problem instanceof Error?problem.message:'Şəkil yüklənmədi.');}
  finally{setBusy('');if(photoInput.current)photoInput.current.value='';}
 }
 async function removePhoto(){
  if(busy)return;setBusy('photo');setError('');setNotice('');
  try{const response=await fetch('/api/account/avatar',{method:'DELETE'});if(!response.ok)throw Error();setProfile(current=>current?{...current,avatar_url:null}:current);setNotice('Profil şəkli silindi.');window.dispatchEvent(new Event('kiraye:profile'));}
  catch{setError('Şəkli silmək mümkün olmadı.');}finally{setBusy('');}
 }
 function reload(){setLoading(true);setError('');window.location.reload();}
 async function submit(event:FormEvent,action:'profile'|'email'|'email_confirm'){
  event.preventDefault();if(!profile||busy)return;setBusy(action);setError('');setNotice('');const actor=identity.current;
  try{const response=await fetch('/api/account/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='profile'?{action,name,phone,password}:action==='email'?{action,email,password:emailPassword}:{action,email,code:emailCode})});const data=await response.json();if(identity.current!==actor)return;
   if(response.ok&&data.code_sent){setEmailStep(2);setNotice('Kod köhnə e-poçt ünvanına göndərildi.');return;}
   if(response.ok&&data.email_changed&&data.profile){accept(data.profile);setEmailStep(0);setEmailCode('');setNotice('E-poçt dəyişdirildi.');return;}
   if(!response.ok){setError(messages[data.code]||'Dəyişiklik təsdiqlənmədi. Yenidən yoxlayın.');return;}if(!data.profile){setError('Nəticə təsdiqlənmədi. Səhifəni yeniləyin.');return;}
   accept(data.profile);setNotice('Saxlanıldı.');
  }catch{setError('Bağlantı alınmadı. Dəyişiklik nəticəsini səhifəni yeniləyərək yoxlayın.');}finally{setBusy('');setPassword('');setEmailPassword('');}
 }
 const phoneChanged=!!profile&&normalizePhone(phone)!==normalizePhone(profile.phone||'');
 return <><Header/><main className="wrap formPage profileSettings kzAccountPage">
  <div className="cabinetBack profileBack"><Link href="/profile" aria-label="Kabinetə qayıt"><ChevronLeft aria-hidden="true" size={22} strokeWidth={2} /></Link><strong>Profil</strong></div>
  <h1 className="kzPageTitle">Profil</h1>
  {error&&<div role="alert" className="notice error"><span>{error}</span></div>}
  {notice&&<p role="status" className="notice">{notice}</p>}
  {loading?<p role="status">Yüklənir...</p>:!signedIn?<p className="notice"><Link href="/login?next=/account">Davam etmək üçün daxil olun.</Link></p>:profile?<div className="kzAccountGrid">
   <section className="kzPanel kzPhotoPanel kzPhotoCompact">
    <UserAvatar src={profile.avatar_url} name={profile.name}/>
    <div>
     <strong>{profile.name||'Profil'}</strong>
     <small>{profile.profile_no?`Profil № ${profile.profile_no}`:''}{profile.profile_no&&profile.created_at?' · ':''}{profile.created_at?`${azDate(profile.created_at)} tarixindən`:''}</small>
     <div className="kzPhotoActions">
      <button type="button" className="textButton" disabled={!!busy} onClick={()=>photoInput.current?.click()}>{busy==='photo'?'Yüklənir…':profile.avatar_url?'Şəkli dəyiş':'Şəkil əlavə et'}</button>
      {profile.avatar_url&&<button type="button" className="textButton danger" disabled={!!busy} onClick={removePhoto}>Sil</button>}
     </div>
     <input ref={photoInput} type="file" accept="image/*" hidden onChange={event=>changePhoto(event.target.files?.[0])}/>
    </div>
   </section>
   <form className="kzPanel listingForm accountForm" onSubmit={event=>submit(event,'profile')}>
    <h2>Şəxsi məlumatlar</h2>
    <label>Adınız<input value={name} onChange={e=>setName(e.target.value)} maxLength={100} required autoComplete="name"/></label>
    <label>Telefon<PhoneInput label="Telefon" value={phone} onChange={setPhone} required /></label>
    <button className="kzButton" disabled={!!busy}>{busy==='profile'?'Saxlanılır…':'Yadda saxla'}</button>
   </form>
   <div className="kzPanel listingForm accountForm emailBox">
    <h2>E-poçt</h2>
    <p className="kzEmailNow">{profile.email}</p>
    {emailStep===0&&<button type="button" className="kzButtonGhost" onClick={()=>{setEmail('');setEmailStep(1);setError('');setNotice('');}}>E-poçtu dəyiş</button>}
    {emailStep===1&&<form onSubmit={event=>submit(event,'email')}><label>Yeni e-poçt<input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required autoComplete="email"/></label><label>Cari şifrə<input type="password" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} autoComplete="current-password" required maxLength={512}/></label><div className="emailActions"><button className="kzButton" disabled={!!busy}>{busy==='email'?'Göndərilir…':'Kod göndər'}</button><button type="button" className="kzButtonGhost" onClick={()=>setEmailStep(0)}>Ləğv et</button></div></form>}
    {emailStep===2&&<form onSubmit={event=>submit(event,'email_confirm')}><p className="muted">6 rəqəmli kod {profile.email} ünvanına göndərildi.</p><label>Kod<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\D/g,''))} required autoComplete="one-time-code"/></label><div className="emailActions"><button className="kzButton" disabled={!!busy}>{busy==='email_confirm'?'Yoxlanılır…':'Təsdiqlə'}</button><button type="button" className="kzButtonGhost" onClick={()=>{setEmailStep(0);setEmailCode('');}}>Ləğv et</button></div></form>}
   </div>
  </div>:null}
 </main><Footer/></>;
}
