import type {MetadataRoute} from 'next';
import {publicSiteUrl} from '../lib/site-url';
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:'*',allow:'/',disallow:['/admin','/balance','/profile','/account','/edit/','/new','/login','/auth/','/reset-password','/listings/example-']},sitemap:`${publicSiteUrl()}/sitemap.xml`};}
