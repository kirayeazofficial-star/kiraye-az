"use client";
import { siteContact } from '../../lib/site-contact';
import { useLanguage } from './LanguageProvider';
import { Mail, Phone } from 'lucide-react';
import { InstagramIcon, TikTokIcon } from './BrandIcons';
export default function SiteContact(){const{t}=useLanguage();return <section className="siteContact" aria-label={t("Bizimlə əlaqə")}><strong>{t("Bizimlə əlaqə")}</strong><a className="kzContactLine" href={siteContact.phoneHref}><Phone aria-hidden="true" size={16} strokeWidth={2} />{siteContact.phone}</a><a className="kzContactLine" href={`mailto:${siteContact.email}`}><Mail aria-hidden="true" size={16} strokeWidth={2} />{siteContact.email}</a><div className="socialLinks"><a href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><InstagramIcon size={15} />Instagram</a><a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer"><TikTokIcon size={15} />TikTok</a></div></section>}
