import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
export default function InactiveListing(){return <><Header/><main className="wrap listingDetailPage"><section className="empty"><h1>Bu elan artıq aktiv deyil</h1><p>Elanın müddəti bitmiş, sahibi tərəfindən silinmiş və ya keçid dəyişmiş ola bilər.</p><Link className="add" href="/">Digər elanlara bax</Link></section></main><Footer/></>}
