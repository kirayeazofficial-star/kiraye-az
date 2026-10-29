import Link from "next/link";
import Header from "./components/Header";
export default function NotFound() {
  return (
    <>
      <Header />
      <main className="wrap">
        <section className="empty">
          <p className="eyebrow">404 · SƏHİFƏ TAPILMADI</p>
          <h1>Bu səhifə tapılmadı</h1>
          <p>Keçid dəyişmiş və ya səhifə silinmiş ola bilər.</p>
          <Link className="add" href="/">
            Elanlara qayıt
          </Link>
        </section>
      </main>
    </>
  );
}
