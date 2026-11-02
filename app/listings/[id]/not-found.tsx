import { CalendarX, House } from "lucide-react";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import StatusCard from "../../components/StatusCard";
import QuickCategories from "../../components/QuickCategories";

// A listing link that leads nowhere (wrong address or a listing that never existed).
export default function InactiveListing() {
  return <>
    <Header />
    <main className="kzScPage">
      <StatusCard tone="warn" icon={CalendarX} badge="Elan aktiv deyil" title="Bu elan artıq aktiv deyil"
        lead="Elanın yayım müddəti bitib, elan sahibi tərəfindən silinib və ya keçid dəyişdirilib. Saytdakı digər aktual elanlara baxa bilərsiniz."
        actions={[{ href: "/", label: "Digər elanlara bax", icon: House, primary: true }]}>
        <p className="kzScSub">Kateqoriyalar</p>
        <QuickCategories />
      </StatusCard>
    </main>
    <Footer />
  </>;
}
