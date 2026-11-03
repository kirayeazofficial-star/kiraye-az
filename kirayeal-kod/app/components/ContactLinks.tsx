import { Mail } from "lucide-react";
import { siteContact } from "../../lib/site-contact";
import { InstagramIcon, TikTokIcon } from "./BrandIcons";

// Shared contact rows keep the footer and the menu visually consistent.
export default function ContactLinks() {
  return <div className="kzContactLinks">
    <a className="kzContactEmail" href={`mailto:${siteContact.email}`}><span className="kzContactIcon email"><Mail aria-hidden="true" size={18} strokeWidth={1.8} /></span><span>{siteContact.email}</span></a>
    <div className="kzContactSocials">
      <a href={siteContact.instagram} target="_blank" rel="noopener noreferrer"><span className="kzContactIcon instagram"><InstagramIcon size={18} /></span><span>Instagram</span></a>
      <a href={siteContact.tiktok} target="_blank" rel="noopener noreferrer"><span className="kzContactIcon tiktok"><TikTokIcon size={18} /></span><span>TikTok</span></a>
    </div>
  </div>;
}
