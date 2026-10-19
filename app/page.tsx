"use client";

import { useMemo, useState } from "react";

const categories = [
  { icon: "⌂", name: "Ev və mənzil", count: "Günlük və aylıq" },
  { icon: "▣", name: "Avtomobil", count: "Günlük kirayə" },
  { icon: "◉", name: "Motosiklet", count: "Günlük kirayə" },
  { icon: "⌑", name: "Villa və bağ evi", count: "Günlük və aylıq" }
];

const listings = [
  { category: "Ev və mənzil", title: "Nizami metrosu yaxınlığında 2 otaqlı mənzil", price: "45 ₼", term: "günlük", place: "Bakı, Nəsimi", image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=900&q=80" },
  { category: "Avtomobil", title: "Hyundai Elantra 2022", price: "55 ₼", term: "günlük", place: "Bakı", image: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=80" },
  { category: "Villa və bağ evi", title: "Mərdəkan bağ evi, hovuzlu", price: "180 ₼", term: "günlük", place: "Bakı, Mərdəkan", image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=900&q=80" }
];

export default function Home() {
  const [selected, setSelected] = useState("Hamısı");
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => listings.filter((item) =>
    (selected === "Hamısı" || item.category === selected) &&
    `${item.title} ${item.place}`.toLocaleLowerCase("az").includes(query.toLocaleLowerCase("az"))
  ), [selected, query]);

  return <main>
    <header className="header"><a className="logo" href="#top">kiraye<span>.az</span></a><nav><a href="#elanlar">Elanlar</a><a href="#nece-isleyir">Necə işləyir?</a><a href="#footer">Əlaqə</a></nav><button className="add">+ Elan yerləşdir</button></header>
    <section className="hero" id="top"><div><p className="eyebrow">AZƏRBAYCANIN KİRAYƏ BAZARI</p><h1>Axtardığın kirayə<br />buradan başlayır.</h1><p className="lead">Ev, avtomobil, motosiklet və daha çoxu — bir yerdə.</p></div>
      <div className="search"><label>Harada və ya nə axtarırsan?<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Məsələn: Bakı, Nizami, Elantra" /></label><div className="chips">{["Hamısı", "Ev və mənzil", "Avtomobil", "Motosiklet", "Villa və bağ evi"].map((item) => <button key={item} onClick={() => setSelected(item)} className={selected === item ? "active" : ""}>{item}</button>)}</div><a href="#elanlar" className="searchButton">Elanlara bax →</a></div>
    </section>
    <section className="wrap"><div className="sectionTitle"><div><p className="eyebrow">KATEQORİYALAR</p><h2>Nə kirayələmək istəyirsən?</h2></div></div><div className="categories">{categories.map((category) => <button key={category.name} onClick={() => { setSelected(category.name); document.getElementById("elanlar")?.scrollIntoView({ behavior: "smooth" }); }}><span className="icon">{category.icon}</span><strong>{category.name}</strong><small>{category.count}</small><span>→</span></button>)}</div></section>
    <section className="listings wrap" id="elanlar"><div className="sectionTitle"><div><p className="eyebrow">YENİ ELANLAR</p><h2>Seçilmiş elanlar</h2></div><button className="textButton">Bütün elanlar →</button></div><div className="grid">{filtered.map((listing) => <article key={listing.title}><div className="photo" style={{ backgroundImage: `url(${listing.image})` }}><span>{listing.category}</span><button aria-label="Seçilmişlərə əlavə et">♡</button></div><div className="card"><h3>{listing.title}</h3><p>{listing.place}</p><strong>{listing.price} <small>/ {listing.term}</small></strong></div></article>)}</div>{filtered.length === 0 && <p className="empty">Bu axtarışa uyğun elan tapılmadı.</p>}</section>
    <section className="how" id="nece-isleyir"><div className="wrap"><p className="eyebrow">SADƏ VƏ TƏHLÜKƏSİZ</p><h2>Elan vermək 3 addımda</h2><div className="steps"><div><b>1</b><h3>Elanı yarat</h3><p>Şəkil, qiymət və məlumatları əlavə et.</p></div><div><b>2</b><h3>Təsdiq gözlə</h3><p>Elanın yoxlanıldıqdan sonra yayımlansın.</p></div><div><b>3</b><h3>Müştəri tap</h3><p>Zəng və WhatsApp ilə əlaqə saxla.</p></div></div></div></section>
    <footer id="footer"><a className="logo" href="#top">kiraye<span>.az</span></a><p>Ev, avtomobil və daha çoxunun kirayəsi.</p><small>© 2026 kiraye.az. Bütün hüquqlar qorunur.</small></footer>
  </main>;
}
