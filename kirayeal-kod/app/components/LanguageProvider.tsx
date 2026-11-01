"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { extraDictionary } from "../../lib/i18n";
export type Language = "az" | "ru" | "en";
const dictionary: Record<string, [string, string]> = {
 "Axtarış":["Поиск","Search"],
 "Müddət":["Срок","Period"],
 "Çatdırılma":["Доставка","Delivery"],"Razılaşma ilə":["По договорённости","By agreement"],
 "Axtarışı saxla":["Сохранить поиск","Save search"],"Saxlanmış axtarışlar":["Сохранённые поиски","Saved searches"],
 "Elanları göstər":["Показать объявления","Show listings"],
 "Həftəlik":["На неделю","Weekly"],"həftə":["неделя","week"],
 "Bağla":["Закрыть","Close"],"Kataloq":["Каталог","Catalog"],"Ev, maşın, avadanlıq axtar":["Жильё, авто, оборудование","Homes, cars, equipment"],"Son elanlar":["Последние объявления","Latest listings"],"Premium elanlar":["Премиум объявления","Premium listings"],"Bənzər elanlar":["Похожие объявления","Similar listings"],"Filtrlər":["Фильтры","Filters"],"Bütün elanlar":["Все объявления","All listings"],
 "Axtar":["Найти","Search"],
 "Azərbaycanın kirayə platforması":["Платформа аренды Азербайджана","Azerbaijan’s rental marketplace"],
 "Almağa tələsmə. Kirayələ.":["Не спеши покупать. Арендуй.","Don’t rush to buy. Rent."],
 "KİRAYƏ ÜÇÜN BİR ÜNVAN":["ВСЁ ДЛЯ АРЕНДЫ","ONE PLACE FOR RENTALS"],
 "Elanlar":["Объявления","Listings"],"♡ Seçilmişlər":["♡ Избранное","♡ Favorites"],"Seçilmişlər":["Избранное","Favorites"],
 "Kömək":["Помощь","Help"],"Hesabım":["Мой кабинет","My account"],"Hesab":["Аккаунт","Account"],"Daxil ol":["Войти","Sign in"],"Qeydiyyatdan keç":["Регистрация","Sign up"],"+ Elan yerləşdir":["+ Разместить","+ Post a listing"],"Elan yerləşdir":["Разместить","Post a listing"],"Ana səhifə":["Главная","Home"],
 "Mesajlar":["Сообщения","Messages"],"Yeni elan":["Новое объявление","New listing"],"Əsas":["Главная","Home"],"Kabinet":["Кабинет","Account"],
 "Dil":["Язык","Language"],"Bizimlə əlaqə":["Связаться с нами","Contact us"],"Menyunu aç":["Открыть меню","Open menu"],"Menyunu bağla":["Закрыть меню","Close menu"],"Sayt menyusu":["Меню сайта","Site menu"],"Sayt bölmələri":["Разделы сайта","Site sections"],
 "Günlük və aylıq kirayə":["Аренда на день и на месяц","Daily and monthly rentals"],"Almağa tələsmə.":["Не спеши покупать.","Don’t rush to buy."],"Kirayələ.":["Арендуй.","Rent."],
 "Ev, nəqliyyat, avadanlıq — ehtiyacına uyğun olanı tap, sahibi ilə birbaşa danış.":["Жильё, транспорт, оборудование — найди нужное и свяжись с владельцем.","Homes, vehicles, equipment — find what you need and contact the owner."],
 "Bir ünvan. Çox seçim.":["Один сайт. Большой выбор.","One place. More choice."],"Şəhəri seç, qiymətləri müqayisə et,":["Выбери город, сравни цены,","Choose a city, compare prices,"],"kirayəni birbaşa razılaşdır.":["договорись об аренде напрямую.","arrange your rental directly."],
 "HƏR EHTİYACA BİR SEÇİM":["ДЛЯ ЛЮБОЙ ЗАДАЧИ","SOMETHING FOR EVERY NEED"],"Nə kirayələmək istəyirsən?":["Что хочешь арендовать?","What would you like to rent?"],"Kateqoriyalar":["Категории","Categories"],"Bütün kateqoriyalar":["Все категории","All categories"],"Kateqoriyaları bağla":["Скрыть категории","Hide categories"],
 "Nə axtarırsan?":["Что ищешь?","What are you looking for?"],"Elan axtar":["Поиск объявлений","Search listings"],"Ev, avtomobil, avadanlıq...":["Жильё, автомобиль, оборудование...","Home, car, equipment..."],"Harada?":["Где?","Where?"],"Şəhər":["Город","City"],"Bütün şəhərlər":["Все города","All cities"],"Kirayə müddəti":["Срок аренды","Rental period"],"İstənilən müddət":["Любой срок","Any period"],"Günlük":["На день","Daily"],"Aylıq":["На месяц","Monthly"],"Elanları axtar →":["Найти объявления →","Search listings →"],
 "SƏNİN ÜÇÜN SEÇİMLƏR":["ПОДБОРКА ДЛЯ ТЕБЯ","OPTIONS FOR YOU"],"Kirayə elanları":["Объявления об аренде","Rental listings"],"Seçilmiş elanlar":["Избранные объявления","Favorite listings"],"Elanlar yüklənir...":["Загрузка объявлений...","Loading listings..."],"Sıralama":["Сортировка","Sort"],"Əvvəlcə yenilər":["Сначала новые","Newest first"],"Əvvəlcə ucuz":["Сначала дешевле","Price: low to high"],"Əvvəlcə bahalı":["Сначала дороже","Price: high to low"],"Depozitsiz kirayə":["Без депозита","No deposit"],"Ətraflı filtrlər":["Больше фильтров","More filters"],"Filtrləri sıfırla":["Сбросить фильтры","Reset filters"],"Son axtarışların":["Последние поиски","Recent searches"],"Tarixçəni təmizlə":["Очистить историю","Clear history"],"Sürətli baxış":["Быстрый просмотр","Quick view"],"Nümunə":["Пример","Sample"],"gün":["день","day"],"ay":["месяц","month"],
 "Ev və mənzil":["Дома и квартиры","Homes and apartments"],"Avtomobil":["Автомобили","Cars"],"Motosiklet":["Мотоциклы","Motorcycles"],"Villa və bağ":["Виллы и дачи","Villas and country houses"],"Kommersiya":["Коммерческие помещения","Commercial property"],"Alətlər və texnika":["Инструменты и техника","Tools and machinery"],"Geyim və aksesuar":["Одежда и аксессуары","Clothing and accessories"],"Elektrik skuter və velosiped":["Электросамокаты и электровелосипеды","Electric scooters and bikes"],"Foto və video":["Фото и видео","Photo and video"],"Turizm və düşərgə":["Туризм и кемпинг","Travel and camping"],"Velosiped":["Велосипеды","Bicycles"],"Tədbir üçün":["Для мероприятий","For events"],
 "Elan":["Подать","Post"],
 "Populyar kateqoriyalar":["Популярные категории","Popular categories"],"Məlumat və kömək":["Информация и помощь","Information and help"],
 "Ehtiyacın olanı almalı deyilsən.":["Нужное не обязательно покупать.","You don’t have to buy what you need."],"Şəxsi kabinet":["Личный кабинет","My account"],"Qaydalar və təhlükəsizlik":["Правила и безопасность","Rules and safety"],"Məxfilik":["Конфиденциальность","Privacy"],
 "Necə işləyir?":["Как это работает?","How does it work?"],"Tap → müqayisə et → sahibi ilə razılaş":["Найди → сравни → договорись с владельцем","Find → compare → contact the owner"],"Elanlara baxmaq üçün qeydiyyat lazım deyil.":["Просмотр объявлений без регистрации.","No account is needed to browse listings."],"Elan vermək istəyirsən? Əvvəl hesabına daxil ol.":["Хочешь разместить объявление? Войди в аккаунт.","Want to post a listing? Sign in first."],
 "Bütün elanlara bax":["Все объявления", "Browse all listings"],
 "Elanlara bax →":["Смотреть объявления →", "View listings →"],
 "Filtrləri təmizlə":["Сбросить фильтры", "Clear filters"],
 "Kateqoriya":["Категория", "Category"],
 "Otaq sayı":["Количество комнат", "Rooms"],
 "İstənilən":["Любое", "Any"],
 "1 otaq":["1 комната", "1 room"],
 "2 otaq":["2 комнаты", "2 rooms"],
 "3 otaq":["3 комнаты", "3 rooms"],
 "4 və daha çox":["4 и более", "4 or more"],
 "Minimum sahə (m²)":["Минимальная площадь (м²)", "Minimum area (m²)"],
 "Sürətlər qutusu":["Коробка передач", "Transmission"],
 "Avtomat":["Автомат", "Automatic"],
 "Mexaniki":["Механика", "Manual"],
 "Depozitsiz":["Без депозита", "No deposit"],
 "Tarix filtri elan sahibinin göstərdiyi aralığa əsaslanır. Mövcudluğu əlaqə saxlayaraq dəqiqləşdir.":["Фильтр дат учитывает период, указанный владельцем. Уточни доступность напрямую.", "Date filters use the owner’s stated availability. Confirm availability directly."],
 "Yenidən yoxla":["Повторить", "Try again"],
 "Uyğun elan tapılmadı":["Подходящих объявлений нет", "No matching listings"],
 "Başqa sözlə axtar və ya öz kirayə elanını yerləşdir.":["Попробуй другой запрос или размести своё объявление.", "Try another search or post your own rental listing."],
 "← Əvvəlki":["← Назад", "← Previous"],
 "Növbəti →":["Далее →", "Next →"],
 "İSTİFADƏ ETMƏDİYİN ƏŞYA GƏLİRİN OLSUN":["ВЕЩИ МОГУТ ПРИНОСИТЬ ДОХОД", "LET UNUSED ITEMS EARN FOR YOU"],
 "Səndə var, başqasına lazımdır.":["У тебя есть — кому-то нужно.", "You have it. Someone needs it."],
 "Elanını yerləşdir, kirayə götürmək istəyənlərlə əlaqə qur.":["Размести объявление и найди арендаторов.", "Post a listing and connect with renters."],
 "İlk elanını yerləşdir →":["Разместить первое объявление →", "Post your first listing →"],
 "Kateqoriyaları bağla ×":["Скрыть категории ×", "Hide categories ×"],
 "Bütün kateqoriyalar →":["Все категории →", "All categories →"],
 "Başlanğıc tarixi":["Дата начала", "Start date"],
 "Son tarix":["Дата окончания", "End date"],
 "Günlük və aylıq qiymətləri ayrıca müqayisə etmək üçün kirayə müddətini seç.":["Выбери срок аренды, чтобы сравнить цены за день или месяц.", "Choose a rental period to compare daily or monthly prices."],
 "Minimum qiymət":["Минимальная цена", "Minimum price"],
 "Maksimum qiymət":["Максимальная цена", "Maximum price"],
 "elan tapıldı":["объявлений найдено", "listings found"],
 "nümunə":["пример", "sample"],
 "Seçilmişlərdən çıxar":["Убрать из избранного", "Remove from favorites"],
 "Seçilmişlərə əlavə et":["Добавить в избранное", "Add to favorites"],
 "Depozit":["Депозит", "Deposit"],
 "Depoziti dəqiqləşdir":["Уточни депозит", "Confirm deposit"],
};
for (const [key, value] of Object.entries(extraDictionary)) dictionary[key] ??= value;

// Texts written directly in components (not through t()) are translated on the page itself:
// each Azerbaijani text node or placeholder found in the dictionary is swapped, and restored
// when Azerbaijani is chosen again. Only the node text changes, so React keeps working normally.
const originals = new WeakMap<Node, string>();
const attributeOriginals = new WeakMap<Element, Record<string, string>>();
const translatedAttributes = ["placeholder", "aria-label", "title"];
function lookup(text: string, language: Language) {
  const key = text.trim().replace(/\s+/g, " ");
  if (!key || language === "az") return null;
  const entry = dictionary[key];
  const value = entry ? entry[language === "ru" ? 0 : 1] : pattern(key, language);
  if (value === null) return null;
  const lead = text.match(/^\s*/)?.[0] || "", tail = text.match(/\s*$/)?.[0] || "";
  return lead + value + tail;
}
// Texts with numbers or times inside them.
const patterns: [RegExp, (match: RegExpMatchArray, language: Exclude<Language, "az">) => string][] = [
  [/^Bu gün, (\d{2}:\d{2})$/, (m, l) => `${l === "ru" ? "Сегодня" : "Today"}, ${m[1]}`],
  [/^Dünən, (\d{2}:\d{2})$/, (m, l) => `${l === "ru" ? "Вчера" : "Yesterday"}, ${m[1]}`],
  [/^(\d+) gün$/, (m, l) => l === "ru" ? `${m[1]} дн.` : `${m[1]} ${m[1] === "1" ? "day" : "days"}`],
  [/^(\d+) həftə$/, (m, l) => l === "ru" ? `${m[1]} нед.` : `${m[1]} ${m[1] === "1" ? "week" : "weeks"}`],
  [/^(\d+) ay$/, (m, l) => l === "ru" ? `${m[1]} мес.` : `${m[1]} ${m[1] === "1" ? "month" : "months"}`],
  [/^(\d+) otaq$/, (m, l) => l === "ru" ? `${m[1]}-комн.` : `${m[1]} ${m[1] === "1" ? "room" : "rooms"}`],
  [/^\/ (\d+) addım$/, (m, l) => l === "ru" ? `/ ${m[1]} шагов` : `/ ${m[1]} steps`],
  [/^(\d+) dəfə \(8 saatdan bir\) — (.+)$/, (m, l) => l === "ru" ? `${m[1]} раз (каждые 8 часов) — ${m[2]}` : `${m[1]} times (every 8 hours) — ${m[2]}`],
  [/^(\d+) gün — (.+)$/, (m, l) => l === "ru" ? `${m[1]} дн. — ${m[2]}` : `${m[1]} ${m[1] === "1" ? "day" : "days"} — ${m[2]}`],
  [/^Aktivdir: (.+) tarixinədək$/, (m, l) => l === "ru" ? `Активно до ${m[1]}` : `Live until ${m[1]}`],
  [/^Müddəti bitib: (.+)$/, (m, l) => l === "ru" ? `Срок истёк: ${m[1]}` : `Expired: ${m[1]}`],
  [/^(VIP|Premium): (.+) tarixinədək$/, (m, l) => l === "ru" ? `${m[1]} до ${m[2]}` : `${m[1]} until ${m[2]}`],
  [/^Bu kateqoriya üzrə pulsuz limitiniz bitib\. Növbəti pulsuz yerləşdirmə: (.+)\.$/, (m, l) => l === "ru" ? `Бесплатный лимит в этой категории исчерпан. Следующее бесплатное размещение: ${m[1]}.` : `Your free limit for this category is used up. Next free placement: ${m[1]}.`],
  [/^Növbəti pulsuz yerləşdirmə: (.+)\.$/, (m, l) => l === "ru" ? `Следующее бесплатное размещение: ${m[1]}.` : `Next free placement: ${m[1]}.`],
  [/^(\d+) elan$/, (m, l) => l === "ru" ? `${m[1]} объявл.` : `${m[1]} ${m[1] === "1" ? "listing" : "listings"}`],
];
function pattern(key: string, language: Language) {
  if (language === "az") return null;
  for (const [expression, render] of patterns) {
    const match = key.match(expression);
    if (match) return render(match, language);
  }
  return null;
}

// True when the current text is the saved original or one of its translations.
function rendered(original: string | undefined, current: string) {
  return original !== undefined && (current === original || current === lookup(original, "ru") || current === lookup(original, "en"));
}
function skip(node: Node) {
  const parent = node.parentElement;
  return !parent || !!parent.closest("script,style,textarea,[translate=no],[contenteditable=true]");
}
function translateText(node: Text, language: Language) {
  if (skip(node)) return;
  const current = node.nodeValue || "";
  const original = originals.get(node);
  // React wrote new text since the last pass: that new text is the original.
  const source = rendered(original, current) ? original! : current;
  if (source !== original) originals.set(node, source);
  const next = lookup(source, language) ?? source;
  if (next !== current) node.nodeValue = next;
}
function translateAttributes(element: Element, language: Language) {
  for (const name of translatedAttributes) {
    if (!element.hasAttribute(name)) continue;
    const saved = attributeOriginals.get(element) || {};
    const current = element.getAttribute(name) || "";
    const original = saved[name];
    const source = rendered(original, current) ? original! : current;
    saved[name] = source; attributeOriginals.set(element, saved);
    const next = lookup(source, language) ?? source;
    if (next !== current) element.setAttribute(name, next);
  }
}
function translateTree(root: Node, language: Language) {
  if (root.nodeType === Node.TEXT_NODE) { translateText(root as Text, language); return; }
  if (!(root instanceof Element) && root !== document.body) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  if (root instanceof Element) translateAttributes(root, language);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.nodeType === Node.TEXT_NODE) translateText(node as Text, language);
    else translateAttributes(node as Element, language);
  }
}

const Context = createContext<{ language: Language; setLanguage: (value: Language) => void; t: (value: string) => string }>({ language: "az", setLanguage: () => {}, t: value => value });
export function LanguageProvider({ children }: { children: React.ReactNode }) {
 const [language, setLanguage] = useState<Language>("az");
 useEffect(() => { try { const saved = localStorage.getItem("kirayeal:language"); if (saved === "ru" || saved === "en") setLanguage(saved); } catch {} }, []);
 useEffect(() => { document.documentElement.lang = language; }, [language]);
 useEffect(() => {
  translateTree(document.body, language);
  if (language === "az") return;
  const observer = new MutationObserver(records => {
   for (const record of records) {
    if (record.type === "characterData") translateText(record.target as Text, language);
    else if (record.type === "attributes") translateAttributes(record.target as Element, language);
    else record.addedNodes.forEach(node => translateTree(node, language));
   }
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: translatedAttributes });
  return () => observer.disconnect();
 }, [language]);
 function choose(value: Language) { setLanguage(value); try { localStorage.setItem("kirayeal:language", value); } catch {} }
 function t(value: string) { return language === "az" ? value : dictionary[value]?.[language === "ru" ? 0 : 1] || value; }
 return <Context.Provider value={{ language, setLanguage: choose, t }}>{children}</Context.Provider>;
}
export const useLanguage = () => useContext(Context);
