import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ListingCard from '../components/ListingCard';
import StructuredData from '../components/StructuredData';
import { seoCategories,type SeoCategorySlug } from '../../lib/seo-categories';
import { categoryListings } from '../../lib/seo-listings';
import { publicSiteUrl } from '../../lib/site-url';
export const dynamic="force-dynamic";
type Props={params:Promise<{landing:string}>};
function config(slug:string){if(!Object.hasOwn(seoCategories,slug))notFound();return seoCategories[slug as SeoCategorySlug];}
export function generateStaticParams(){return Object.keys(seoCategories).map(landing=>({landing}));}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {landing}=await params;const page=config(landing);return {title:`${page.title} elanları | kirayeal.az`,description:page.description,alternates:{canonical:`${publicSiteUrl()}/${landing}`},openGraph:{title:`${page.title} — kirayeal.az`,description:page.description,url:`${publicSiteUrl()}/${landing}`,locale:'az_AZ',type:'website'}};}
export default async function CategoryPage({params}:Props){const {landing}=await params,page=config(landing),{items,unavailable}=await categoryListings(page.category);const base=publicSiteUrl();return <><Header/><main className="wrap seoCatalog"><p className="breadcrumb"><Link href="/">Ana səhifə</Link> / {page.title}</p><h1>{page.title}</h1><p className="seoIntro">{page.description}</p><Link className="secondary" href={`/?category=${page.category}#elanlar`}>Filtrlərlə axtar</Link><h2>Son kirayə elanları</h2>{items.length?<div className="kzGrid">{items.map(item=><ListingCard key={item.id} item={item}/>)}</div>:<p className="notice">{unavailable?'Elanları hazırda yükləmək mümkün olmadı. Ana səhifədə yenidən yoxla.':'Bu bölmədə hələ yayımlanmış elan yoxdur.'}</p>}<section className="seoGuidance"><h2>{page.title} seçərkən nəyə baxmalı?</h2><p>{page.intro}</p></section></main><Footer/><StructuredData data={{'@context':'https://schema.org','@type':'CollectionPage',name:page.title,description:page.description,url:`${base}/${landing}`,inLanguage:'az-AZ',mainEntity:{'@type':'ItemList',itemListElement:items.map((item,index)=>({'@type':'ListItem',position:index+1,url:`${base}/listings/${item.id}`,name:item.title}))}}}/><StructuredData data={{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'kirayeal.az',item:base},{'@type':'ListItem',position:2,name:page.title,item:`${base}/${landing}`}]}}/></>;}
