# Hostinq.az cPanel-də yerləşdirmə

Hazırkı tətbiq Next.js standalone server ilə işləyir. `app.js` cPanel-in
CloudLinux / Passenger başlatma faylıdır. Standalone serverə və brauzer
fayllarına `npm run build` + avtomatik `postbuild` əmri hazırlıq edir.
Bu keçid Vercel-dəki yerləşdirməni əvəz edir; istifadəçi, elan və şəkillər
hələ Supabase-də qalır. Baza və hesabların köçürülməsi ayrıca mərhələdir.

## Panel parametrləri

- Node.js: 22.x (hazırkı hostinqdə 22.23.3).
- Application mode: Production.
- Application startup file: `app.js`.
- Application URL: `kirayeal.az`, yanındakı yol boş.
- Application root: kodun yerləşdiyi qovluq; Node virtual environment qovluğu deyil.

## Kodu GitHub-dan gətirmək

cPanel → Git Version Control → Create:

- Clone a Repository: aktiv.
- Clone URL: `https://github.com/kirayeazofficial-star/kiraye-az.git`.
- Repository Path: `/home/kiraytfg/kirayeal-source`.
- Repository Name: `kirayeal`.

Git yalnız boş/yeni qovluğa klonlaya bilir. Mövcud CloudLinux tətbiqinin
Application root dəyəri `kirayeal` QALMALIDIR. Kodu `kirayeal-source` qovluğundan
`kirayeal` qovluğuna kopyala; `node_modules`, `nodevenv` və serverdəki özəl
konfiqurasiyanı əvəz etmə. İşləyən tətbiqin kökünü mövcud kod qovluğuna
relocate etmək `public` toqquşması və yarımçıq virtual mühit köçürülməsi yaradır.
Startup file `app.js` qalsın.
GitHub layihənin mənbəyidir; bazanın və istifadəçilərin saxlanma xidməti deyil.

## Dəyişənlər və yığım

Node.js panelində Environment variables hissəsində mövcud layihənin
brauzer üçün açıq dəyərlərini əlavə et:

- `NEXT_PUBLIC_SUPABASE_URL`: hazırkı Supabase Project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: publishable key (və ya köhnə
  layihə üçün `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- `NEXT_PUBLIC_SITE_URL`: `https://kirayeal.az`.

Service-role / secret key brauzer dəyişənlərinə yazılmır. Saytın açıq
Supabase dəyərlərini dəyişəndə yenidən build lazımdır; tək Restart kifayət etmir.

Paneldə göstərilən Node.js virtual environment aktivləşdirmə əmrini cPanel
Terminal-da və ya SSH sessiyasında olduğu kimi işlət. Koddakı `node_modules`
qovluğunu panelin yaratdığı virtual environment symlink-i ilə qarışdırma.
`Run NPM Install` düyməsi ilə asılılıqları qur. Sonra həmin Node mühitində,
tətbiqin kök qovluğunda:

```sh
node scripts/check-public-env.mjs
npm run build
```

Terminal/SSH icazəsi yoxdursa, provayderdən məhz bu tətbiqin Node mühitində
`npm run build` işlətməsini istə; panelin hansı script icrasını dəstəklədiyini
yoxlamadan başqa yol fərz etmə. Hostinqdə yığım resurs limiti ilə dayansa,
Node 22 ilə uyğun Linux mühitində, eyni public dəyişənlərlə hazırlanmış
standalone paket yerləşdirmək alternativdir.

Build bitəndə cPanel-də Restart et. Serverin portunu panel/Passenger idarə edir;
kənara 3000 portu açmaq lazım deyil. `HOSTNAME` serverin bağlandığı ünvan üçün
normalizə edilir, domen isə Application URL ilə idarə olunur.

## Domen, SSL və giriş

Domenin səlahiyyətli DNS xidmətində A/AAAA və www qeydləri yoxlanılmalıdır.
Hostinqin göstərdiyi IP ilə uyğunlaşdır; şəkildə görünən shared IP-ni digər
qeydləri yoxlamadan avtomatik tətbiq etmə. DNS-də poçt üçün MX/SPF/DKIM
qeydlərini silmə. SSL sertifikatı aktiv olduqdan sonra HTTPS istifadə et.

Supabase Authentication → URL Configuration bölməsində Site URL:
`https://kirayeal.az`. Redirect URLs siyahısına aşağıdakıları əlavə et:

- `https://kirayeal.az/auth/callback`
- `https://kirayeal.az/auth/callback?flow=recovery`
- `https://kirayeal.az/reset-password`

Vercel ünvanlarını köçürmə tam yoxlanana qədər saxla. Digər OAuth provayderləri
aktivdirsə, onların domen ayarlarını da yoxla.

## Yoxlama

- `https://kirayeal.az/api/health`: HTTP 200.
- Ana səhifə və `_next/static` JS/CSS faylları: HTTP 200.
- Birbaşa elan keçidi, səhifəni yeniləmə, şəkillər.
- Qeydiyyat, e-poçt təsdiqi, giriş, şifrə bərpası.
- Şəkillə elan göndərişi, admin təsdiqi, şəxsi kabinet.

Paneldə `Application created` mesajı yalnız tətbiq yerinin yaradıldığını
bildirir. Mənbə, dəyişənlər, asılılıqlar və production build olmadan sayt hazır deyil.
Poçt qutusu/SMTP və onun göndəriş limitləri ayrıca yoxlanılmalıdır; bu quraşdırma
telefon SMS xidməti yaratmır. Mövcud Vercel/Supabase layihələrini yoxlamalar
bitməmiş silmə.

## CloudLinux yaddaş limiti və hazır paket

`Max address space = 4294967296` prosesin virtual ünvan sahəsinin 4 GiB ilə
məhdudlaşdırılmasıdır. Bu, eyni miqdarda fiziki RAM istifadəsi demək deyil.
Node 22-də `NODE_OPTIONS=--disable-wasm-trap-handler` WebAssembly başlanğıc
xətasını aradan qaldıra bilər. Ardınca native `Zone Allocation failed` və ya
`Worklist::Segment::Create` ilə yığım dayanarsa, eyni build-i təkrar işlətmə.
Təkcə JavaScript heap limitini böyütmək virtual ünvan limitini dəyişmir.

Alternativ: ayrıca Linux x64 mühitində Node 22 ilə, məqsədə uyğun public
konfiqurasiya verərək `npm ci`, `npm run build` və aşağıdakı əmri işlət:

```sh
npm run package:hosting
```

Nəticə `dist/hosting` qovluğundadır. `app.js` və gizli `.next` qovluğu daxil
olmaqla içindəkiləri ZIP-ə sal. ZIP-in üstündə əlavə `hosting` qovluğu olmasın.
Arxivi mövcud `/home/kiraytfg/kirayeal` tətbiq qovluğuna çıxar və Restart et.
Hostinqdə yenidən NPM Install və ya build işlətmək lazım deyil. Runtime
asılılıqları `.next/standalone/node_modules` daxilində paketlənir.
Paket başqa qovluqda açıldıqdan sonra da yoxlanılmalıdır: `/api/health`, ana
səhifə, `_next/static` faylları, birbaşa elan keçidi.

Public baza konfiqurasiyası olmayan paket skript tərəfindən normalda rədd edilir.
Yalnız açıq şəkildə nümunə/interfeys rejimi üçün
`node scripts/package-hosting.mjs dist/hosting --allow-unconfigured` işlədilə
bilər. Bu paketdə real qeydiyyat/giriş/elan göndərişi yoxdur; onu tam köçürülmüş
sayt kimi təqdim etmə. `HOSTING-INFO.json` və `HOSTING-README.txt` bunu qeyd edir.
Supabase-dən asılılığı çıxarmaq üçün server bazası, autentifikasiya, storage və
icazə qaydaları ayrıca yazılıb real məlumatlarla yoxlanmalıdır.
