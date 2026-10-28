import Header from "../components/Header";
import Footer from "../components/Footer";
import AdminWorkspace from "../components/AdminWorkspace";

export default function AdminPage(){
 return <><Header/><main className="wrap dashboard adminDashboard"><div className="sectionTitle adminPageHeading"><h1>İdarəetmə paneli</h1></div><AdminWorkspace/></main><Footer/></>;
}
