> ƏN YENİ: [CLOUD-CONTINUATION-2026-10-26.md](CLOUD-CONTINUATION-2026-10-26.md). İş bulud sessiyasında davam edir; aşağıdakı “dayan” göstərişi tarixidir. Yeni kod yoxlamasını canlı aktivləşmə sayma.

> ƏN YENİ DAYANMA QEYDİ: docs/FINAL-CONTINUATION-2026-10-26.md əsasdır. Canlı 30667110 / QNmrh09tfW8tkX3waKeW4; son mənbə deb40e33 planşet CSS-i hələ canlı deyil. Profil SQL COMMIT edilib, təkrar işlətmə. Son geniş qəbul 768px daşmasında dayandı, profil API/sessiya testlərinə çatmadı. Main göndərişindən sonra istifadəçinin göstərişi ilə iş dayandırılır. Köhnə aşağıdakı statusları cari nəticə sayma.

# Vahid iş siyahısı — kirayeal.az

## Son faktiki yenilənmə

- Son mobil qəbul tamamlanıb: `MOBILE-RESULT-2026-10-26.md`. 395 yoxlama/96 yüklənmiş səhifə-ölçü kombinasiyası və ayrıca 39 loading/error/empty yoxlaması keçib. Testlər təmizlənib; aktiv operator prosesi yoxdur. Real Safari və iPhone klaviatura yoxlanmayıb. Son ehtiyat `2026-10-26T12-46-33-782Z` DB+15 şəkildir, ayrıca PG17 bərpası və 38 davranış yoxlaması keçib. Yeni nüsxənin portativ şifrələnməsi və Drive upload hələ qalıb.

- İş davam edir; bağlanma göstərişi ləğv olunub. İlkin aşağı siyahıdakı tarixli gözləyən qeydlər bu nəticələrlə birlikdə oxunsun.
- 26.10.2026 11:49UTC tam snapshot dump +15şəkil: `.kirayeal-secure/db-backups/2026-10-26T11-48-15-710Z`;7hesab/11elan/2söhbət/3mesaj. SHA256dump `d31347eef77b62c4677bea93c209f5c8c0e01a26ddef2d095a5f9c1d6a5936ef`. AyrıPG17bərpasında bütünsaylar uyğun,37əvvəlkidavranış sınağı keçib. Drive/arxivavtomatikası hələ hazır deyil.
- `account-navigation.sql` 12:04UTC canlıya bir dəfə tətbiq olunub;14yoxlama keçib, real məlumat/rollar dəyişməyib. Numeric-ID-onlylookup/assignment, köhnəUUIDendpointrevoked və ownlimitsRPCvar. Təkrar tətbiq etmə. Köhnə SQLsınağının email/UUIDlookup gözləntisi artıq yeniqərarla əvəz edilib.
- Son canlı mənbə `aa2a9827540dc8be253630c88d97f0fb09192622`, build `Sr7MeI9xpQAWHZkdvm1-1`; source iş qolundadır,main dəyişməyib. Tətbiq rollbacknüsxəsi `[serverdə qorunan yol]`.
- Dar ekran CSS,16pxformcontrol, normalwrapkabinetkartları,320pxtək sütun, seçilmişbölmədəcollapsemenyu, chatgörünənviewport/composer, inboxtime/loading/error ayrılması canlıdadır. Real Safari/real iPhoneklaviatura yoxlanmayıb.
- İlk mobilönbaxış334check/90layoutrow keçsə də bəzi ekranlarloadingidi; onu finalqəbul sayma. Son sınaq yüklənmişməzmuna,uzunada və ayrıtestRəhbərə gücləndirilib. `live-mobile-final.cjs` terminal46157nəticəsi ƏVVƏL yoxlansın; nəticə `.kirayeal-secure/live-mobile-final-result.json`. Davam edirsə təkrarbaşlatma.
- Profil email/3contactchange/re-auth hələ yoxdur; mövcud ad/phoneformunu tamprofil kimi göstərmə. SignupSMTP550, GoogleOAuth, fullhost-only, realviewsflag, Driveautomatikası və digər backlog açıqdır.
- Sahib Rəhbərin ID-sini30000004təsdiqləyib. Onun elanına yazılan mesajın alıcısı məhz o olmalıdır. Digər sahibin30000058elanına bağlı threadi Rəhbərəçatdırılma sübutu sayma. Sonmetadataaudit realmövcud2threadin30000058elanlarınabağlıolduğunugöstərib; həminxüsusiistifadəçibildirişi tamhəll edilmişsayılmır.

İstifadəçinin bağlanma göstərişi ləğv olunub. İş davam edir. Bütün əvvəlki tapşırıqlar qüvvədədir; son qərarlar ziddiyyətli köhnə UI/admin/profil qaydalarını əvəz edir. Bu siyahı digər sənədləri silmir. `[x]` yalnız göstərilən sınaq çərçivəsində yoxlanmış işi bildirir.

## 1. Məlumatların qorunması və canlı vəziyyət

- [x] SSH, Node22, tətbiq yolu və əvvəlki kod yerləşdirməsi yoxlanıb; son məlum release dba1cc166. Yeni mərhələdə health yenidən yoxlansın.
- [x] Rəhbərin Gmail dəyişikliyi: ID/rol/elan/tarixçə qorunub, sahib yeni giriş/paneli təsdiqləyib.
- [x] Əvvəlki tam baza+14şəkil nüsxəsi və ayrı PG17 bərpa sınağı keçib.
- [ ] Son09:13UTCdump inventarını yoxla;14şəkli tamamla,6hesab sayını təxmin etmədən araşdır; yeni nüsxəni ayrıca bərpa et.
- [ ] Son kod/config/DB/Auth/mesaj/şəkilləri portativ şifrəli ehtiyata daxil et; əvvəlki nüsxələri saxla.
- [ ] “SAYTIM HARADA SAXLANILIR” sənədini real son vəziyyətlə yenilə, masaüstü və Drive-a yerləşdir; yeni kompüter üçün Codex bərpa tapşırığı saxla.

## 2. Mesaj çatdırılması — hazırkı ilk prioritet

- [x] Mesaj SQL-i canlıda; iştirakçı RLS, blok/şikayət, server limitləri və34DBsınağı keçib.
- [x] Əvvəlki iki idarə olunan brauzer/API sınağı55yoxlamadan keçib; test qeydləri təmizlənib.
- [ ] Sahibin yeni “salam alıcıda görünmür” problemini ayrıca araşdır: DBpersist, düzgün alıcı/thread, təsdiq/session, inbox/RLS, polling/focus, girişdən sonra yenilənmə.
- [ ] İki ayrıca sessiyada hər iki istiqamət, reload VƏ logout/login, unread, blok/report/rate, başqa hesab məxfiliyi sınağı.
- [ ] Desktopda nəzərəçarpan Mesajlar+unread; rahat şrift/list/composer, ad+rəqəmliID+elan, private əlaqə məlumatı sızdırılmasın.

## 3. Qeydiyyat və hesab girişi — əsas qəbul şərti

- [x] Recovery503precheck və trustedTCP/proxy/spoofing429/foreignOrigin403 həlli əvvəl yoxlanıb.
- [ ] SMTP550realAuthrəddinin provayder Exim/spamd loqları ilə səbəbi və həlli. Adi Acceptedmail uğur sayılmır. Spam/TLS/cəhd qoruması söndürülmür.
- [ ] Real qeydiyyat→6rəqəmliemailOTP→giriş/çıxış→bərpaOTP→yenişifrə→giriş. Yanlış/vaxtıbitmiş/təkrarkod/cəhd/resend limitləri. Bərpa hesab yaratmır, saxta sent uğuru yoxdur.
- [ ] GoogleCloudOAuthclient/secret/consent/callback və testuserməhdudiyyətsiz real login; avtomatikadmin yoxdur.
- [ ] İki ayrı test ünvanına real çatdırılma; SPF/DKIM/DMARC/kvota yoxlaması; kütləvi mail yoxdur.
- [ ] Kod sahəsi birbaşa açılsın, “linki aç” təlimatı çıxarılsın;6rəqəm dəqiq qalsın.
- [ ] Özbaşına logout səbəbi: refresh/storage/cookie/domen/redirect; rememberme giriş/uyğunsignup, təhlükəsiz daxili geri dönüş, real signout.

## 4. Admin və səlahiyyət

- [x] Əvvəl leader/moderator, təyinat/revocation server qoruması və audit sınağı keçib.
- [ ] Yeni qərar: təyinat hesab axtarışı YALNIZ dəyişməz rəqəmliID; phone/email/UUID serverdə rədd, önbaxış, leader qorunması/audit. Elan axtarışında phone qalsın.
- [ ] Desktopaccountmenu+mobile birbaşa səlahiyyətliadminlink; adi istifadəçi görmür, server də qoruyur.
- [ ] Ayrı elanlar/elanşikayəti/mesajşikayəti/arxiv/audit/leaderstaff bölmələri.
- [ ] Audit elan nömrəsi/adından detail, silinmişdə snapshot; gizli elan məxfiliyi.
- [ ] Bakı saniyəli tarixlər, sabit unikal nömrələr, tək tarix axtarışı, şikayət nömrə+tarix, reportreviewer/time və50dənsonrapager canlı təkrar qəbul sınağı.

## 5. Kabinet və profil

- [x] Sürüşən7realstatus, saxta paidstatus yoxdur;320/390/1440daşma sınağı keçib.
- [ ] Sectionselect əvəzinə ikonlu menyu: elanlar/pultarixçə/kartlar/limitlər/profil; ayrıcaçıxış, hərbölmə özməzmunu.
- [ ] Ad-soyad dəyişməsi; bir əsas telefon; phone/email hərəsinə3uğurludəyişiklik server/bazada, raceguard. Initial/equal/failed/cancelled sayılmır;emailconfirmationdan sonra sayılır. Remaining/support.
- [ ] Sensitive reauth, UUID/elan/tarixçə sabit. SMS/telefonOTP yoxdur, telefonverifiedsayılmır.
- [ ] Yeni elan əsasphoneistifadəetsin, mövcudphonefərqləri inventar/ehtiyat olmadan kütləvi dəyişməsin.
- [ ] Realdatadan0,00₼balans, yüklənməyibsəunknown; yalnızöz real pul tarixçəsi. Kart/CVVtoplama yoxdur.
- [ ] Limitlər: mövcudkateqoriyarəqəmləri, active/cycleused/remaining/rolling30renew serverdən; yeni rəqəm uydurulmur.

## 6. Elanlar, baxış və mobil görünüş

- [x] Əvvəl həftəlikşəkillielan/moderasiya/redaktə/expiryqorunma/arxiv/paidrestorebağlılığı yoxlanıb.
- [ ] Bütün köhnə checklistSQL-lərinin mövcud tətbiqini schemaəsasında təsdiq; schema.sqlblindrun yoxdur.
- [ ] 30güncron və cron dayanandada publicexpiryguard, limitbypass/adminbaşqasınıtəsdiq qaydası, yumşaqsilinmə/oldinactiveURLməxfiliyi tam qəbul sınağı.
- [ ] Realviewsfeatureflag yalnız owner/dedup/trustedproxy/invalidJWT/crossorigin canlı yoxlamadan sonra açılır; realunikalinsan/zəng kimi təqdim edilmir.
- [ ] Günlük/həftəlik/aylıq, moto yürüş/marka/model/il, həyət evi/villamərtəbə/sanuzel, noautofill/editpreservation, delivery/deposit/minimum/hesablayıcı/draftaccountisolation bütünkateqoriyasınaqları.
- [ ] TəbiiAZsearch, satıcıadı→aktivads, oxşarads/report, publicdate/nömrə/contactmask/safety; köhnə watermarkorijinalsızkorlanmır, yeniphotosfaintcenterbrand.
- [ ] Kartda yığcamheart, quickview/kateqoriyaoverlayçıxsın; hearteventkartıaçmasın, ölçüsabit. YuxarıYeniElanqalsın, ortaIRICTAçıxsın; bottomnavuyğunlaşsın.
- [ ] Dar ekran/klaviatura/uzunmətn/ad/emptyresults, menuX/forms,AZRUEN/calendar, desktop; Chromium iPhoneSafariadlandırılmır.
- [ ] HTTPS/www/canonical/robots/sitemap/serverHTML/favicons, private/noindex və SearchConsoleowner/sitemap yenidənyoxlama.

## 7. Tam köçürmə və fəlakətdən bərpa

- [ ] Hostinqdə PostgreSQL17/roles/extensions, Auth/API/Storageproseslər, disk/RAM/cron/mail/səlahiyyət/proxy imkanları provayderlə dəqiqləşsin; MariaDBPostgreSQLscripti işləmir.
- [ ] ID/hash/ownership/photoURL/oldlistingURL/audit/mesaj qoru; yeniAuthmövcudparollarla işlənsin, plaintextyoxdur. Ayrıhostda bütünplatformabərpası sınağı.
- [ ] Supabase/Vercel/Netlifyrealdependencyinventarı; əvəzedicilər+sahibinsonkonkrettəsdiqi olmadan silmə.
- [ ] DriveofflineOAuth+privatefolder+productionagekey; kompütersizgündəlik/deploysuccessbackup, tarixlinüsxələr, hashverifiedupload, failure/stalealertrealtest; DriveURL/datehesabatı.
- [ ] Registrar/domenhesabının həqiqətən sahibdəolduğuyoxlansın. MasaüstüCodexqısayolu/AZglobaltəlimat əvvəlhazırqeydinifaktikiyoxla, lazımsızyenidənqurma.

## Daim bağlı və istənilməyənlər

Ödəniş/topup/kart/reklam/paidrestore bağlı. SaxtaVIP/premium/balans/tarixçəyoxdur. Availabilitystatus/comparison/rentalwanted/SMS/Apple/yeniqiymət/uydurulmuşlimit/böyükdizaynyoxdur. İstifadəçi məlumatı/qoruma/backup saxlanır, məxfilikGit-əçıxmır.
