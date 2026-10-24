# kirayeal.az — SEO və canlı aktivləşdirmə

24 oktyabr 2026: ana səhifə və indekslənən `/kiraye-masin`, `/kiraye-ev` səhifələri üçün fərqli başlıq/təsvir, canonical URL, serverdə görünən məzmun, Organization/WebSite/CollectionPage/BreadcrumbList JSON-LD və sitemap hazırlanıb. Elanların qiyməti və mətnləri istifadəçi məlumatlarıdır; saxta reytinq, ünvan və təminat əlavə edilmir.

Canlı keçiddə birinci yoxla:

1. `NEXT_PUBLIC_SITE_URL=https://kirayeal.az`, işlək HTTPS, əsas domenin düzgün HTTP cavabı. Yeni domen hazır olmadan köhnə işlək Vercel ünvanını məcburi yönləndirmə ilə söndürmə.
2. İctimai kateqoriya səhifələri və real elanlar girişsiz server HTML-də görünməlidir. Yalnız yayımlanmış və müddəti bitməmiş elanlar göstərilsin. Baza bağlantısı səhvi olsa uydurma nümunələr indekslənməsin.
3. `/robots.txt` və `/sitemap.xml` işləsin; şəxsi səhifələrdə noindex olsun. Sitemap son 1000 yayımlanmış elanla məhduddur; say artdıqda sitemap hissələrə bölünsün.
4. Domenin sahibinə aid Google Search Console hesabında DNS TXT ilə domen təsdiqi lazımdır. Sitemap təqdim et, ana səhifə və iki kateqoriya URL-i üçün URL Inspection ilə indeksləmə sorğusu ver. Hazırkı mühitdə Search Console girişi yoxdur; təqdim edildiyi iddia edilmir.
5. Google sıralama, təklif və indeksləmə vaxtını özü müəyyənləşdirir. Kod dəyişməsi nəticələrdə zəmanətli yer və ya dərhal görünüş demək deyil. İndeksləmə və məzmun göstəricilərini sonradan Search Console-da izləmək lazımdır.

Hazırkı mühitdən canlı sayta sorğu şəbəkə proksisinin 403 cavabı ilə bloklanır. Bu, saytın özünün 403 qaytardığını sübut etmir; canlı yoxlama ayrıca qalır.
