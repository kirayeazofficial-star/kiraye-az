import { House, Plus, Search, SearchX } from "lucide-react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import StatusCard from "./components/StatusCard";
import QuickCategories from "./components/QuickCategories";

export default function NotFound() {
  return <>
    <Header />
    <main className="kzScPage">
      <StatusCard icon={SearchX} badge="Xəta 404" title="Səhifə tapılmadı"
        lead="Axtardığınız səhifə mövcud deyil və ya ünvanı dəyişdirilib. Ünvanın düzgün yazıldığını yoxlayın, aşağıdakı axtarışdan istifadə edin və ya ana səhifəyə qayıdın."
        actions={[{ href: "/", label: "Ana səhifəyə qayıt", icon: House, primary: true }, { href: "/new", label: "Elan yerləşdir", icon: Plus }]}>
        <form className="kzScSearch" action="/" method="get" role="search">
          <input name="q" type="search" placeholder="Elan axtar" aria-label="Elan axtar" maxLength={120} />
          <button className="kzScBtn primary" type="submit"><Search aria-hidden="true" size={17} strokeWidth={2} />Axtar</button>
        </form>
        <p className="kzScSub">Populyar kateqoriyalar</p>
        <QuickCategories />
      </StatusCard>
    </main>
    <Footer />
  </>;
}
