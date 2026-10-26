<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Live access priority — user instruction, 24 October 2026

As soon as authorized working SSH or live database access is available, complete the pending server work in `docs/HOSTING-MIGRATION-CHECKLIST.md` BEFORE subsequent feature tasks, unless the user explicitly reprioritizes. This includes all deferred database migrations, old and new listing policies, public access, auth, six-digit email delivery, SMTP and deployment checks, not only listing limits. Preserve data and backups; verify replacements before removing Supabase/Vercel. Source commits do not prove live activation. Payments stay inactive until separately authorized.

## Product choices — 24 October 2026

Read `docs/FUTURE-IDEAS.md` during future product planning. The user deferred the “Kirayə axtarıram” board and rejected availability status and listing comparison. Do not add those without a new instruction. Weekly rates and view statistics require the migration and server setup in the hosting checklist; do not claim they are live from a source commit.

## Latest archive policy — 24 October 2026

The user now requires all archived/expired listing restoration to be paid, including early manual removal. Payments are still inactive. Apply `supabase/paid-restoration.sql` AFTER `listing-lifecycle.sql`; never re-enable the old free restoration RPC or direct edit path. Preserve archived data/photos. Do not invent a restoration price.

## Latest public presentation — 25 October 2026

New uploads use a centered, faint white wordmark without a background. Existing baked watermarks require original files to replace losslessly. Public contact starts with the final two digits masked, then reveals the full number and safety note. Payments/cards stay inactive; never fabricate wallet activity or promotion badges. Apply `public-marketplace.sql` after the dependencies recorded in the hosting checklist before claiming its server features live.

## Mobile account navigation — 25 October 2026

The user wants account access in the bottom-right mobile navigation, with language selection above. Hide the signed-in header avatar on mobile; keep it on desktop. The cabinet uses a mobile section select and separate listing-status select instead of horizontally clipped rows. Desktop uses the sidebar. Keep payments inactive and preserve all account/listing data.

## Daimi iş qaydaları — istifadəçinin son göstərişi, 26 oktyabr 2026

Bu bölmə əvvəlki ziddiyyətli məhsul qeydlərini əvəz edir; qalan təlimatları silmə.

- İstifadəçi ilə sadə Azərbaycan dilində danış. Xəta və konkret təsdiq sorğusunda əməliyyatın nəyi dəyişəcəyini qısa bildir. Əlaqəli təhlükəsiz yoxlamaları birləşdir. Təhlükəsizlik/təsdiq mexanizmlərini zəiflətmə. Yalnız həmin anda lazım olan bir istifadəçi addımını istə; bloklanmayan işlərə davam et.
- İşi yeni tapşırıq kimi yenidən başlama. Əvvəl `docs/CONTINUATION-2026-10-26.md` və ən yeni nəticə hesabatını oxu; görülən/qalan işləri, sübutları, ehtiyat və geri dönüş yerini yenilə. Tarixi “giriş yoxdur” qeydlərini cari fakt sayma.
- Birinci canlı tətbiq/config və real şəbəkə yolunu yoxla: kod, DB, Auth, Storage haradadır; Supabase/Vercel/Netlify asılılığı və işləyən köhnə ünvanlar nədir. Təkcə mənbədə xidmət adına əsaslanma. Hesabatdan sonra prioritet qeydiyyat, email təsdiqi, giriş/çıxış, kodla bərpa/yeni şifrə və Google OAuth-dur. SMTP və OAuth girişləri çatmırsa konkret panel/addım göstər. Göndərilməmiş məktubu uğurlu göstərmə, təhlükəsizlik yoxlamalarını söndürmə.
- Əsas domen `kirayeal.az`-dır. Supabase/Vercel əvəzediciləri real yoxlanmadan silinmir. Silinməyə hazır olanda sübutları göstər və sahibin son konkret təsdiqini al. Netlify barədə də yalnız canlı sübutla nəticə çıxar.
- Rəhbərin giriş e-poçtu `kirayeal.az@gmail.com`-dur: ID, parol, səlahiyyət, elan və tarixçə qorunub; sahib yeni giriş/paneli təsdiqləyib. Bu ünvan SMTP göndərəni deyil; göndərən `noreply@kirayeal.az` olaraq ayrıca qurulur. Yeni rəhbər və ya hesab birləşməsi təxmin etmə.
- Mobil düzülüşdə Kirayeal-ın öz adı/rəngi/kateqoriyaları qalır. Tap.az materialı/loqosu köçürülmür. Məlumat menyusu mövcud yardım/qaydalar/məxfilik/əlaqə/dil keçidlərini açır. Aşağı naviqasiya: Əsas, Seçilmişlər, Yeni elan, Mesajlar, Kabinet. İşləməyən boş bölmə/düymə əlavə etmə; safe-area və klaviatura məzmunu örtməsin.
- Son status tələbi əvvəlki mobil status select qaydasını ƏVƏZ EDİR: real elan statusları/sayları telefonda üfüqi sürüşən ardıcıllıqla göstərilir. Məqsədli status sürüşməsi ümumi səhifə daşması yaratmamalıdır. Kabinet menyusu: Mənim elanlarım, Əməliyyat tarixçəsi, Mənim kartlarım, Limitlər, Profil, Çıxış.
- Profil ad/telefon/email redaktəsi serverdə qorunur. Həssas dəyişiklikdə uyğun təkrar giriş, emaildə təsdiq lazımdır; UUID/elan/tarixçə qorunur. SMS təsdiqi olmayan telefon təsdiqlənmiş göstərilmir. Balans yalnız real server cavabından `0,00 ₼` formatında göstərilir; yüklənməyibsə saxta sıfır yoxdur. Tarixçə yalnız sahibin real pul qeydləridir. Limit rəqəmləri mövcud təsdiqlənmiş qaydadan alınır; Tap.az rəqəmi uydurulmur.
- Ödəniş, balans artırma, kart əlavə etmə, reklam və pullu bərpa BAĞLI qalır. Xam kart/CVV toplanmır. Aktiv olmayan pullu xidmət üçün aldadıcı “Reklam et” düyməsi göstərilmir. Mövcud telefon maskası/təhlükəsizlik qeydi qorunur. Satıcının adı aktiv yayımlanmış elanlarına aparır. Baxış yalnız həqiqi, təkrar sorğu/sahib baxışına qarşı qorunan server qeydi ilə açılır; qeyri-aktiv xidmətdə saxta rəqəm yoxdur.
- Saytdaxili elan dialoqları təsdiqlənmiş yeni işdir: yalnız giriş etmiş iki iştirakçı, elan əlaqəsi, oxunmamış göstəricisi və davamlı tarixçə. Oxuma/yazma iştirakçılığı, özünə mesaj qadağası, spam/sorğu məhdudiyyəti, blok/şikayət server/DB səviyyəsində qorunur. WhatsApp keçidi bunu əvəz etmir. İnfrastruktur hazır deyilsə boş işləməyən interfeys qurma. Mesajlar tam ehtiyata daxil olur.
- Dəyişiklikdən əvvəl uyğun tam ehtiyat. Real istifadəçini sınaq üçün dəyişmə; öz idarə olunan test hesablarını ayrıca qeyd et/təmizlə. Qeydiyyat/email/Google/bərpa/profil/status/baxış/iki hesab mesajlaşması canlıda, mobil və kompüterdə yoxlanır. Chromium real iPhone Safari kimi təqdim edilmir. Build və ya GitHub commit canlı uğur sübutu deyil.
- Kod mövcud GitHub reposunda qalır. DB/Auth/şəkil/server ayarları şifrəli, portativ ehtiyatda və sahibin Google Drive hesabında saxlanmalıdır. Parol, özəl açar, token, SQL dump və istifadəçi məlumatını Git/GitHub mənbəyinə/loga çıxarma. Arxiv parolunu GitHub-da saxlama; avtomatik şifrələmə üçün yalnız açıq recipient açarı istifadə et. Şifrəli bərpa açarı və parolu sahibin ayrıca idarəsində qalır.
- Gündəlik və hər həqiqətən uğurlu deploy-dan sonrakı ehtiyat kompüterdən asılı olmamalıdır. Əvvəlki tarixli nüsxələr qorunur, uğursuzluq və köhnəlmə bildirişi ayrıca yoxlanır. Drive upload, son uğurlu vaxt, ölçü/hash və ayrıca bərpa sınağı olmadan avtomatlaşdırmanı hazır sayma. Domenin registrar/DNS idarəsinə sahibin çıxışı ayrıca təsdiqlənir; DNS-in hostinqə baxması sahiblik sübutu deyil.
