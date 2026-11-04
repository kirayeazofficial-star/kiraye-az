# Görünüş və işləmə düzəlişləri — 4 noyabr 2026

Yaşıl-narıncı brend saxlanılaraq ön səhifə, elan kartları, axtarış, kabinet və rəhbər paneli vahid səth, şrift və boşluq qaydalarına uyğunlaşdırılıb. Şəkilləri örtən əlavə dekorativ qatlar istifadə olunmur.

| Hissə | Problem və nəticə |
| --- | --- |
| Mobil menyu | İkon ölçüləri yazıları fərqli səviyyəyə salırdı. İkon sahələri bərabərləşdirildi, yazılar sütunun tam eninə yerləşdirildi. |
| Elan kartları | Böyük qiymət və kirayə müddəti kəsilirdi. Məbləğ və müddət ayrıca yerləşir, lazım olduqda sətirə keçir. İki sətirlik başlığın hündürlüyü sətir aralığına uyğunlaşdırıldı. |
| Məhsul şəkilləri | Geyim, avadanlıq, kamera və tədbir avadanlığı fotoları çərçivəni doldurarkən kəsilə bilirdi. Bu kateqoriyalarda şəkil bütöv göstərilir. |
| Hesabdan çıxış | Bağlantı xətası düyməni gözləmə vəziyyətində saxlayırdı. Xəta tutulur, sorğu vaxtı məhdudlaşdırılır və yenidən cəhd mümkündür. |
| Kabinetin yenilənməsi | Gecikmiş cavab yeni məlumatı əvəz edə bilirdi. Əvvəlki sorğular dayandırılır; sessiya bitəndə köhnə hesab məlumatları və başlıqdakı hesab menyusu təmizlənir. |
| Tarixçə | Sürətli təkrar basışlar eyni kursoru təkrarlaya bilirdi. Yeni səhifə gələnədək keçid kilidlənir və köhnə qeydlər yeni səhifə nömrəsi altında göstərilmir. |
| Mobil kataloq | Kataloq ayrıca dialoq kimi açılır: fon sürüşmür, fokus dialoqda qalır, bağlama düyməsi sürüşdürmə zamanı görünür. |
| Profil kartı | Ad və profil ID-si saxlanılır. Telefon və e-poçt profil ayarlarında idarə olunur; məlumatlar bazadan silinmir. |
| Seçilmişlər | Boş siyahının təlimatı artıq elanın səhifəsindəki seçilmişlər düyməsinə yönəldir. |

## Yoxlama

`test:responsive`, `test:cards`, `test:catalog`, `test:session`, `test:account-layout`, `test:history`, `test:auth`, `test:messages`, `test:ui`, `test:audit`, `test:gallery` və `test:quality` uyğun davranışları yoxlayır. Bərpa və Premium/VIP sorğuları yalnız yerli PostgreSQL bazasında geri qaytarılan tranzaksiyalarla yoxlanılır.

Görünüş nümunələrində sınaq elanları istifadə olunur; bu elanlar canlı bazaya əlavə edilmir. Ekran ölçüsü yoxlamaları brauzerdə aparılır, bütün fiziki telefon modellərində sınaq demək deyil.

Hostinqdə yeni versiyanı göstərmək üçün hazır `site` paketini cPanel-də **Update from Remote → Deploy HEAD Commit** ilə tətbiq etmək lazımdır.
