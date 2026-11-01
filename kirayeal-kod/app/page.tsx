import type { Metadata } from "next";
import HomeCatalog from "./components/HomeCatalog";
import { publicSiteUrl } from "../lib/site-url";
export const metadata:Metadata={title:{absolute:"Kirayə ev, mənzil və maşın elanları — kirayeal.az"},description:"kirayeal.az — Bakıda və bütün Azərbaycanda kirayə ev, mənzil, villa, maşın, motosiklet və avadanlıq elanları. Günlük, həftəlik və aylıq kirayə təkliflərini tap, sahibi ilə birbaşa əlaqə saxla.",alternates:{canonical:publicSiteUrl()},openGraph:{title:"kirayeal.az — Kirayə üçün bir ünvan",description:"Kirayə ev, maşın və avadanlıq elanlarını tap.",url:publicSiteUrl(),locale:"az_AZ",type:"website"}};
export default function Home(){return <HomeCatalog/>;}
