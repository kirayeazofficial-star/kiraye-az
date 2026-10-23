# E-poçt kodu ilə şifrə bərpası

Tətbiqdə axın: **Şifrəni unutmusunuz? → e-poçt → 6 rəqəmli kod → yeni şifrə**.
Kod Supabase tərəfindən yaradılır və `verifyOtp` ilə `recovery` növündə yoxlanır.
Səhv və ya vaxtı bitmiş kod yeni şifrə formasını açmır. Parol brauzerdə saxlanmır.
Köhnə məktublardakı bərpa linkləri də dəstəklənir.

## Supabase layihəsində bir dəfə edilməlidir

1. Authentication → Email Templates → Reset Password bölməsində məktubun mətnini
   `supabase/templates/recovery.html` faylının məzmunu ilə əvəz et. Mövzu:
   `kiraye.az — Şifrə bərpa kodu`. `{{ .Token }}` Supabase-in kod dəyişənidir;
   link dəyişəni ilə əvəz etmə.
2. Email provider ayarlarında Email OTP Length dəyərini **6** et. Kodun etibarlılıq
   müddətini layihənin təhlükəsizlik siyasətinə uyğun saxla (məsələn, 10 dəqiqə).
3. Authentication → Email/SMTP bölməsində təsdiqlənmiş göndərən domeni ilə
   işlək SMTP xidməti qur. Supabase-in standart göndəriş xidməti bütün istifadəçilər
   üçün istehsal göndərişi təmin etmir. Gmail alıcısı olmaq Gmail parolu və ya
   Google girişini tələb etmir. SMTP sirrlərini yalnız Supabase-də saxla.
4. Auth URL Configuration bölməsində saytın faktiki ünvanını və əvvəlki
   `/reset-password`, `/auth/callback` yönləndirmələrini saxla.
5. Öz test hesabınla kod istə, Gmail/Spam qovluğunu yoxla, səhv kodun rədd
   edildiyini, düzgün koddan sonra yeni şifrənin saxlandığını və yeni şifrə ilə
   girişin işlədiyini yoxla. Məktub gəlməsə Supabase Auth və SMTP loglarını yoxla.

Repo faylının dəyişməsi Supabase-in idarə olunan ayarlarını dəyişmir. SMTP,
şablon, 6 rəqəm ayarı və real çatdırılma ayrıca tətbiq olunmalı/yoxlanmalıdır.
Brauzer testləri Auth cavablarını simulyasiya edir, real məktub göndərmir.

## Hesabın mövcudluğunun dəqiq yoxlanması

`supabase/recovery-check.sql` tətbiq edilməli, `SUPABASE_SERVICE_ROLE_KEY` yalnız serverin məxfi mühitində saxlanmalıdır. Bu açar heç vaxt `NEXT_PUBLIC_` dəyişəninə və ya brauzer koduna qoyulmur. `/api/auth/recovery-check` yalnız mövcudluq nəticəsini qaytarır, istifadəçi siyahısı və açarı qaytarmır. Server-only RPC hər IP izi üçün 15 dəqiqədə 10 yoxlama ilə məhdudlaşdırılır; hostinqdə proksi IP başlığını özü təyin etməlidir.

Yoxlama hesabın olmadığını təsdiqləyirsə, bərpa məktubu istənilmir və “Bu e-poçtla hesab tapılmadı” göstərilir. Server yoxlaması qurulmayıbsa, Supabase-in mövcud təhlükəsiz bərpa axını saxlanılır, amma kod xanası dərhal açılmır. İstifadəçi məktubu faktiki alandan sonra “Bərpa məktubum gəlib” ilə kodu yaza bilər. HTTP uğur cavabı məktubun inbox-a çatması kimi təqdim edilmir.

Bu server yoxlaması SMTP-ni qurmur. “Error sending confirmation email” real poçt konfiqurasiyasının/göndərən domenin yoxlanmasını tələb edir; kod göndərmə uğuru uydurulmur və e-poçt təsdiqi söndürülmür.
