import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminWorkspace from "../components/AdminWorkspace";

export default function AdminPage(){
 return <><Header/><main className="wrap dashboard adminDashboard"><div className="sectionTitle"><div><p className="eyebrow">İDARƏETMƏ</p><h1>Rəhbər paneli</h1><p className="muted">Sayt, elanlar, istifadəçilər və komanda bir yerdə.</p></div></div><AdminWorkspace/></main><Footer/></>;
}
