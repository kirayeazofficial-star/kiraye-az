export const seoCategories={
 'kiraye-masin':{category:'car',title:'Kirayə maşın',description:'Azərbaycanda günlük, həftəlik və aylıq kirayə maşın elanları. Avtomobilin markasını, qiymətini, depozitini və kirayə şərtlərini müqayisə et.',intro:'İş səfəri, gündəlik istifadə və ya uzunmüddətli kirayə üçün uyğun avtomobili tap. Elanın qiymət vahidinə, yürüş limitinə və sürücü tələblərinə bax; mövcudluğu elan sahibi ilə dəqiqləşdir.'},
 'kiraye-ev':{category:'property',title:'Kirayə ev və mənzil',description:'Bakı və Azərbaycanın şəhərlərində kirayə ev, mənzil və bağ evi elanları. Günlük, həftəlik və aylıq təkliflərə bax.',intro:'Otaq sayı, sahə, şəhər və kirayə müddətinə uyğun ev seç. Kommunal xərcləri, depoziti və təhvil şərtlərini elanda yoxla, son qiyməti və mövcudluğu sahibi ilə razılaşdır.'},
} as const;
export type SeoCategorySlug=keyof typeof seoCategories;
