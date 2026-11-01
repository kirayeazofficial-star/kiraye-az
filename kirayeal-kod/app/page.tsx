import type { Metadata } from "next";
import HomeCatalog from "./components/HomeCatalog";
import { publicSiteUrl } from "../lib/site-url";
export const metadata:Metadata={title:{absolute:"Kirayə Al — kirayeal.az | Kirayə ev, maşın və avadanlıq elanları"},description:"kirayeal.az (Kirayə Al) — Azərbaycanda kirayə ev, mənzil, maşın, motosiklet, geyim və avadanlıq elanları. Günlük, həftəlik və aylıq təklifləri tap, elan sahibi ilə birbaşa əlaqə saxla.",alternates:{canonical:publicSiteUrl()},openGraph:{title:"kirayeal.az — Kirayə üçün bir ünvan",description:"Kirayə ev, maşın və avadanlıq elanlarını tap.",url:publicSiteUrl(),locale:"az_AZ",type:"website"}};
export default function Home(){return <HomeCatalog/>;}
