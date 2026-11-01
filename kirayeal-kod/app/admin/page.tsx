import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminTitle from "../components/AdminTitle";
import AdminWorkspace from "../components/AdminWorkspace";

export default function AdminPage(){
 return <><Header/><main className="wrap dashboard adminDashboard kzAdmin"><div className="kzAdminHead"><AdminTitle/><p>Elanları, şikayətləri və istifadəçiləri bir yerdən idarə et.</p></div><AdminWorkspace/></main><Footer/></>;
}
