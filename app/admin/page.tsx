import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminWorkspace from "../components/AdminWorkspace";

export default function AdminPage(){
 return <><Header/><main className="wrap dashboard adminDashboard"><div className="sectionTitle adminPageHeading"><div><p className="eyebrow">İDARƏETMƏ MƏRKƏZİ</p><h1>Rəhbər paneli</h1><p className="muted">Elanları, şikayətləri və istifadəçiləri bir yerdən idarə et.</p></div><span className="adminSecureBadge">Təhlükəsiz giriş</span></div><AdminWorkspace/></main><Footer/></>;
}
