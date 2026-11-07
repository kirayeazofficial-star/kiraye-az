"use client";
import Notice from "./Notice";
import { AlertCircle, Bell, Camera, Check, CheckCircle2, ChevronLeft, ChevronRight, Copy, Mail, Phone, Smartphone, Star, Trash2, UserRound } from "lucide-react";
import {FormEvent,useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import Header from './Header';
import Footer from './Footer';
import {normalizePhone} from '../../lib/rental-details';
import {formatContact} from '../../lib/contact-mask';
import {squareAvatar} from '../../lib/avatar-image';
import UserAvatar from './UserAvatar';
import PhoneInput from './PhoneInput';
import { useAutoClear } from "../../lib/use-auto-clear";
type Profile={email_notifications?:boolean;profile_no:number;name:string;phone:string;email:string;role:string;staff_role:string|null;phone_changes:number;email_changes:number;phone_remaining:number;email_remaining:number;phone_verified:false;pending_email:string|null;created_at?:string|null;avatar_url?:string|null};
const azMonths=['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'];
function azDate(iso:string){const d=new Date(iso);return`${d.getDate()} ${azMonths[d.getMonth()]} ${d.getFullYear()}`}
const messages:Record<string,string>={reauth_failed:'Cari şifrə düzgün deyil.',recent_login_required:'Telefon və ya e-poçt dəyişikliyi üçün cari şifrənizi yazın.',phone_limit_reached:'Telefon üçün üç dəyişiklik haqqı bitib. Dəstəyə müraciət edin.',email_limit_reached:'E-poçt üçün üç dəyişiklik haqqı bitib. Dəstəyə müraciət edin.',invalid_profile:'Ad-soyad və düzgün Azərbaycan telefon nömrəsi tələb olunur.',invalid_email:'Düzgün e-poçt ünvanı yazın.',rate_limited:'Çox cəhd edilib. 15 dəqiqə sonra yenidən yoxlayın.',mail_delivery_failed:'Təsdiq məktubu göndərilmədi. E-poçt dəyişdirilməyib; göndəriş xidməti yoxlanmalıdır.',email_change_failed:'E-poçt dəyişikliyi alınmadı. Ünvanı və təsdiq imkanını yoxlayın.',invalid_code:'Kod yanlışdır və ya vaxtı bitib.',email_taken:'Bu e-poçt artıq istifadə olunur.',same_email:'Bu, hazırkı e-poçtundur.',email_change_not_started:'E-poçt dəyişikliyi başlamadı. Ünvanı yoxlayın və ya dəstəyə müraciət edin.',provider_reauth_required:'Bu hesab üçün giriş provayderi ilə yenidən təsdiq tələb olunur.',sign_in_required:'Hesabınıza yenidən daxil olun.',profile_unavailable:'Profil xidməti hazır deyil. Heç bir uğur təsdiqlənmədi.'};
export default function ProfileSettings(){
 const [profile,setProfile]=useState<Profile|null>(null),[name,setName]=useState(''),[phone,setPhone]=useState(''),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[emailPassword,setEmailPassword]=useState(''),[loading,setLoading]=useState(true),[signedIn,setSignedIn]=useState(false),[busy,setBusy]=useState(''),[notice,setNotice]=useState(''),[error,setError]=useState(''),[where,setWhere]=useState('');
 useAutoClear(notice, () => setNotice(""));
 async function toggleNotices(enabled:boolean){if(!profile)return;setBusy('notify');setError('');const previous=profile.email_notifications;setProfile({...profile,email_notifications:enabled});
  try{const response=await fetch('/api/account/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'notifications',enabled})});if(!response.ok)throw new Error();setNotice(enabled?'Bildirişlər açıldı.':'Bildirişlər söndürüldü.');}
  catch{setProfile({...profile,email_notifications:previous});setError('Dəyişiklik saxlanmadı. Yenidən cəhd edin.');}finally{setBusy('');}}
 const [open,setOpen]=useState<''|'name'|'phone'|'email'>(''),[idCopied,setIdCopied]=useState(false),[pwLocked,setPwLocked]=useState(true),[photoSheet,setPhotoSheet]=useState(false);
 const identity=useRef('');const [emailStep,setEmailStep]=useState<0|1|2>(0),[emailCode,setEmailCode]=useState('');
 function accept(value:Profile){setProfile(current=>({...value,avatar_url:value.avatar_url!==undefined?value.avatar_url:current?.avatar_url,created_at:value.created_at||current?.created_at}));setName(value.name||'');setPhone(value.phone||'');setEmail(value.pending_email||value.email||'');}
 useEffect(()=>{let active=true;
  async function load(){try{const account=await fetch('/api/auth/host',{cache:'no-store'}).then(r=>r.json());if(!active)return;if(!account.user){setSignedIn(false);return;}identity.current=account.user.id;setSignedIn(true);const response=await fetch('/api/account/profile',{cache:'no-store'});const data=await response.json();if(!active||identity.current!==account.user.id)return;if(!response.ok||!data.profile)throw Error();accept(data.profile);}catch{if(active)setError('Profil məlumatları yüklənmədi. Səhifəni yeniləyin.');}finally{if(active)setLoading(false);}}
  void load();return()=>{active=false;};
 },[]);
 const photoInput=useRef<HTMLInputElement>(null);
 async function changePhoto(file:File|undefined){
  if(!file||busy)return;setBusy('photo');setWhere('photo');setError('');setNotice('');
  try{if(!file.type.startsWith('image/'))throw new Error('Şəkil faylı seçin.');const form=new FormData();form.append('file',await squareAvatar(file),'avatar.jpg');const response=await fetch('/api/account/avatar',{method:'POST',body:form});const data=await response.json();if(!response.ok||!data.avatar_url)throw new Error('Şəkil yüklənmədi. Yenidən yoxlayın.');setProfile(current=>current?{...current,avatar_url:data.avatar_url}:current);setNotice('Profil şəkli yeniləndi.');window.dispatchEvent(new Event('kiraye:profile'));}
  catch(problem){setError(problem instanceof Error?problem.message:'Şəkil yüklənmədi.');}
  finally{setBusy('');if(photoInput.current)photoInput.current.value='';}
 }
 async function removePhoto(){
  if(busy)return;setBusy('photo');setWhere('photo');setError('');setNotice('');
  try{const response=await fetch('/api/account/avatar',{method:'DELETE'});if(!response.ok)throw Error();setProfile(current=>current?{...current,avatar_url:null}:current);setNotice('Profil şəkli silindi.');window.dispatchEvent(new Event('kiraye:profile'));}
  catch{setError('Şəkli silmək mümkün olmadı.');}finally{setBusy('');}
 }
 function reload(){setLoading(true);setError('');window.location.reload();}
 async function submit(event:FormEvent,action:'profile'|'email'|'email_confirm'){
  event.preventDefault();if(!profile||busy)return;setBusy(action);setWhere(action==='profile'?'profile':'email');setError('');setNotice('');const actor=identity.current;
  try{const response=await fetch('/api/account/profile',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(action==='profile'?{action,name,phone,password}:action==='email'?{action,email,password:emailPassword}:{action,email,code:emailCode})});const data=await response.json();if(identity.current!==actor)return;
   if(response.ok&&data.code_sent){setEmailStep(2);setNotice('Kod köhnə e-poçt ünvanına göndərildi.');return;}
   if(response.ok&&data.email_changed&&data.profile){accept(data.profile);setEmailStep(0);setEmailCode('');setOpen('');setNotice('E-poçt dəyişdirildi.');return;}
   if(!response.ok){setError(messages[data.code]||'Dəyişiklik təsdiqlənmədi. Yenidən yoxlayın.');return;}if(!data.profile){setError('Nəticə təsdiqlənmədi. Səhifəni yeniləyin.');return;}
   accept(data.profile);setOpen('');setNotice('Saxlanıldı.');
  }catch{setError('Bağlantı alınmadı. Dəyişiklik nəticəsini səhifəni yeniləyərək yoxlayın.');}finally{setBusy('');setPassword('');setEmailPassword('');}
 }
 const status=(panel:string)=>where===panel&&error?<div className={`kzFormStatus${error?' error':''}`} role={error?'alert':'status'}>{error?<AlertCircle aria-hidden="true" size={18} strokeWidth={2}/>:<CheckCircle2 aria-hidden="true" size={18} strokeWidth={2}/>}<span>{error||notice}</span></div>:null;
 const phoneChanged=!!profile&&normalizePhone(phone)!==normalizePhone(profile.phone||'');
 return <><Header/><main className="wrap formPage profileSettings kzAccountPage">
  <div className="cabinetBack profileBack"><Link href="/profile" aria-label="Kabinetə qayıt"><ChevronLeft aria-hidden="true" size={22} strokeWidth={2} /></Link><strong>Profil</strong></div>
  <h1 className="kzPageTitle">Profil</h1>
  <Notice text={notice} />{!where&&error&&<div role="alert" className="notice error"><span>{error}</span></div>}
  {loading?<p role="status">Yüklənir…</p>:!signedIn?<p className="notice"><Link href="/login?next=/account">Davam etmək üçün daxil olun.</Link></p>:profile?<div className="kzAccountGrid">
   <section className="kzPanel kzAccHead">
    <div className="kzAccAvatar">
     <button type="button" className="kzAccAvatarBtn" disabled={!!busy} aria-label="Profil şəkli" aria-haspopup="dialog" onClick={()=>profile.avatar_url?setPhotoSheet(true):photoInput.current?.click()}><UserAvatar src={profile.avatar_url} name={profile.name}/><span className="kzAccCamera" aria-hidden="true"><Camera size={16} strokeWidth={2}/></span></button>
     <input ref={photoInput} type="file" accept="image/*" hidden onChange={event=>changePhoto(event.target.files?.[0])}/>
    </div>
    <strong className="kzAccName">{profile.name||'Profil'}</strong>
    <div className="kzAccChips">
     {profile.profile_no?<button type="button" className="kzAccChip" aria-label={`ID ${profile.profile_no} — kopyala`} onClick={()=>{void navigator.clipboard?.writeText(String(profile.profile_no)).then(()=>{setIdCopied(true);window.setTimeout(()=>setIdCopied(false),1600);}).catch(()=>{});}}>ID {profile.profile_no}{idCopied?<Check aria-hidden="true" size={14} strokeWidth={2.4}/>:<Copy aria-hidden="true" size={14} strokeWidth={2}/>}</button>:null}
     {profile.staff_role==='leader'&&<span className="kzAccChip lead"><Star aria-hidden="true" size={13} strokeWidth={2.2}/>Rəhbər</span>}
    </div>
    {profile.created_at&&<p className="kzAccSince">{azDate(profile.created_at)} tarixindən saytdadır</p>}
    {busy==='photo'&&<p className="kzAccSince" role="status">Şəkil yüklənir…</p>}
    {busy!=='photo'&&<p className="kzAccSince">{profile.avatar_url?'Şəkli dəyişmək və ya silmək üçün şəkilə toxunun':'Şəkil əlavə etmək üçün şəkilə toxunun'}</p>}
   </section>
   {status('photo')}
   {photoSheet&&<div className="kzSheetLayer" role="dialog" aria-modal="true" aria-label="Profil şəkli" onClick={()=>setPhotoSheet(false)}>
    <div className="kzSheet" onClick={event=>event.stopPropagation()}>
     <span className="kzSheetGrab" aria-hidden="true"/>
     <strong>Profil şəkli</strong>
     <button type="button" onClick={()=>{setPhotoSheet(false);photoInput.current?.click();}}><Camera aria-hidden="true" size={19} strokeWidth={1.9}/>Yeni şəkil seç</button>
     <button type="button" className="danger" onClick={()=>{setPhotoSheet(false);void removePhoto();}}><Trash2 aria-hidden="true" size={19} strokeWidth={1.9}/>Şəkli sil</button>
     <button type="button" className="cancel" onClick={()=>setPhotoSheet(false)}>Ləğv et</button>
    </div>
   </div>}

   <section className="kzPanel kzAccList" aria-label="Şəxsi məlumatlar">
    <h2>Şəxsi məlumatlar</h2>
    {open!=='name'&&    <button type="button" className="kzAccRow" aria-expanded={false} onClick={()=>{setOpen('name');setName(profile.name||'');setError('');}}>
     <span className="kzAccIcon"><UserRound aria-hidden="true" size={18} strokeWidth={1.9}/></span><span className="kzAccText"><small>Ad və soyad</small><b>{profile.name||'Əlavə edin'}</b></span><ChevronRight className="kzAccChevron" aria-hidden="true" size={18} strokeWidth={2}/>
    </button>}
    {open==='name'&&<form className="kzAccEdit listingForm" onSubmit={event=>submit(event,'profile')}>
     <label>Ad və soyad<input value={name} placeholder="Adınız və soyadınız" onChange={e=>setName(e.target.value)} maxLength={100} required autoComplete="name" autoFocus/></label>
     <div className="kzAccEditActions"><button className="kzButton" disabled={!!busy}>{busy==='profile'?'Saxlanılır…':'Yadda saxla'}</button><button type="button" className="kzButtonGhost" onClick={()=>setOpen('')}>Ləğv et</button></div>
     {status('profile')}
    </form>}
    {open!=='phone'&&    <button type="button" className="kzAccRow" aria-expanded={false} onClick={()=>{setOpen('phone');setPhone(profile.phone||'');setError('');}}>
     <span className="kzAccIcon"><Phone aria-hidden="true" size={18} strokeWidth={1.9}/></span><span className="kzAccText"><small>Telefon</small><b>{profile.phone?formatContact(profile.phone):'Nömrənizi əlavə edin'}</b></span><ChevronRight className="kzAccChevron" aria-hidden="true" size={18} strokeWidth={2}/>
    </button>}
    {open==='phone'&&<form className="kzAccEdit listingForm" onSubmit={event=>{if(!phoneChanged){event.preventDefault();setOpen('');return;}void submit(event,'profile');}}>
     <label>Telefon<PhoneInput label="Telefon" value={phone} onChange={setPhone} required /></label>
     <div className="kzAccEditActions"><button className="kzButton" disabled={!!busy}>{busy==='profile'?'Saxlanılır…':'Yadda saxla'}</button><button type="button" className="kzButtonGhost" onClick={()=>setOpen('')}>Ləğv et</button></div>
     {status('profile')}
    </form>}
    {open!=='email'&&    <button type="button" className="kzAccRow" aria-expanded={false} onClick={()=>{setOpen('email');setEmail('');setEmailPassword('');setPwLocked(true);setEmailStep(1);setError('');setNotice('');}}>
     <span className="kzAccIcon"><Mail aria-hidden="true" size={18} strokeWidth={1.9}/></span><span className="kzAccText"><small>E-poçt</small><b>{profile.email}</b></span><ChevronRight className="kzAccChevron" aria-hidden="true" size={18} strokeWidth={2}/>
    </button>}
    {open==='email'&&<div className="kzAccEdit listingForm accountForm emailBox">
          {emailStep===1&&<form onSubmit={event=>submit(event,'email')}><label>Yeni e-poçt ünvanı<input type="email" value={email} onChange={e=>setEmail(e.target.value)} maxLength={254} required autoComplete="off" placeholder="ad@gmail.com" autoFocus/></label><label>Hesabın şifrəsi<input type="password" name="confirm-current" value={emailPassword} onChange={e=>setEmailPassword(e.target.value)} autoComplete="one-time-code" readOnly={pwLocked} onFocus={()=>setPwLocked(false)} required maxLength={512} placeholder="Təsdiq üçün şifrənizi yazın"/></label><div className="emailActions"><button className="kzButton" disabled={!!busy}>{busy==='email'?'Göndərilir…':'Kod göndər'}</button><button type="button" className="kzButtonGhost" onClick={()=>{setEmailStep(0);setOpen('');}}>Ləğv et</button></div></form>}
     {emailStep===2&&<form onSubmit={event=>submit(event,'email_confirm')}><p className="muted">6 rəqəmli kod {profile.email} ünvanına göndərildi.</p><label>Kod<input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={emailCode} onChange={e=>setEmailCode(e.target.value.replace(/\D/g,''))} required autoComplete="one-time-code"/></label><div className="emailActions"><button className="kzButton" disabled={!!busy}>{busy==='email_confirm'?'Yoxlanılır…':'Təsdiqlə'}</button><button type="button" className="kzButtonGhost" onClick={()=>{setEmailStep(0);setEmailCode('');setOpen('');}}>Ləğv et</button></div></form>}
     <div className="kzEmailStatus">{status('email')}</div>
    </div>}
   </section>

   <section className="kzPanel kzAccList" aria-label="Bildirişlər">
    <h2>Bildirişlər</h2>
    <div className="kzAccRow static">
     <span className="kzAccIcon"><Bell aria-hidden="true" size={18} strokeWidth={1.9}/></span>
     <span className="kzAccText"><b>E-poçt bildirişləri</b><small>Yeni mesaj, elanın müddətinin bitməsi və axtarışınıza uyğun yeni elanlar</small></span>
     <label className="kzSwitch"><input type="checkbox" aria-label="E-poçt bildirişləri" checked={profile.email_notifications!==false} disabled={busy==='notify'} onChange={event=>void toggleNotices(event.target.checked)}/><span/></label>
    </div>
    <div className="kzAccRow static">
     <span className="kzAccIcon"><Smartphone aria-hidden="true" size={18} strokeWidth={1.9}/></span>
     <span className="kzAccText"><b>SMS bildirişləri</b><small>Vacib xəbərlər telefonunuza</small></span>
     <span className="kzAccSoon">Tezliklə</span>
    </div>
   </section>

  </div>:null}
 </main><Footer/></>;
}
