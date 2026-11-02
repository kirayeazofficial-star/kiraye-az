"use client";
import { siteContact } from '../../lib/site-contact';
import { useLanguage } from './LanguageProvider';
import { Mail } from 'lucide-react';
import { InstagramIcon, TikTokIcon } from './BrandIcons';
export default function SiteContact(){const{t}=useLanguage();return <section className="siteContact" aria-label={t("Bizimlə əlaqə")}><strong>{t("Bizimlə əlaqə")}</strong><a className="kzContactLine" href={`mailto:${siteContact.email}`}><span className="kzSocialIcon mail"><Mail aria-hidden="true" size={16} strokeWidth={2} /></span>{siteContact.email}</a><div className="socialLinks"><a href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><span className="kzSocialIcon ig"><InstagramIcon size={17} /></span>Instagram</a><a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer"><span className="kzSocialIcon tt"><TikTokIcon size={16} /></span>TikTok</a></div></section>}
