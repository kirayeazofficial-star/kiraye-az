# Dar ekran düzəlişləri

Əvvəlki backlog qüvvədədir. Yeni qəbul matrisi:320,360,375,390,430px; ayrıca375×667; masaüstü1440. Chromium viewport sınağı Safari deyil. Real iPhone7/Safari ayrıca yoxlanmalıdır.

Tapılan səbəb: əvvəlki `.dashboard .cabinetNav a` white-space:nowrap/flex qaydası yeni ikonlu kabinetdə mətnləri sıxır. Yalnız overflow gizlətməklə problemi örtmə; uzun adlar normal sətirə keçməlidir. Status sətri məqsədli üfüqi sürüşə bilər.

Girişli/girişsiz, adi/moderator və mümkün olduqda Rəhbər, uzun mətn/ad, empty/loading/error vəziyyətləri; əsas/catalog/listing/login/reset/new/profile/account/transactions/cards/limits/messages/admin ekranları yoxlanmalıdır. İdarə olunan yeni test hesabları real email çatdırılmasının sübutu deyil. Rəhbərin ID-si30000004; başqa hesabın elanına yazılan mesajı Rəhbərə çatdırılmış sayma.

Profilin hazırkı mənbəyində yalnız ad/telefon upsert-i var. Email dəyişikliyi/təsdiqi, ayrıca3limit və sensitive reauth hələ yoxdur; tam profil funksiyası kimi göstərilə bilməz. Bu iş MASTER-WORK-LIST-də açıq qalır.

Dəyişikliklər əvvəlki işlək nüsxə saxlanaraq, ayrıca build və canlı qəbul sınağı ilə yerləşdirilməlidir. Ödənişlər bağlı; istifadəçilər/elanlar/mesaj/şəkillər qorunur. Klaviatura üçün visualViewport ölçüsü nəzərə alınmalıdır; emulyasiya real iOS klaviatura sınağı sayılmır.
