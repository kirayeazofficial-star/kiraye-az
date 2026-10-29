"use client";
import { useEffect, useState } from "react";
type Banner = { id: string; title: string; image_url: string; media_type?: string; link_url: string | null };

// Wide advert strip above the header on computer screens (the "top" banner place).
export default function TopBanner() {
  const [banner, setBanner] = useState<Banner | null>(null);
  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;
    let active = true;
    fetch("/api/banners?placement=top").then(r => r.json()).then(d => { if (active) setBanner((d.items || [])[0] || null); }).catch(() => {});
    return () => { active = false; };
  }, []);
  if (!banner) return null;
  const click = () => { void fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: banner.id }), keepalive: true }).catch(() => {}); };
  const media = banner.media_type === "video" || /\.(mp4|webm)$/i.test(banner.image_url) ? <video src={banner.image_url} aria-label={banner.title || "Reklam"} muted loop autoPlay playsInline preload="metadata" /> : <img src={banner.image_url} alt={banner.title || "Reklam"} />;
  return <aside className="kzTopBanner" aria-label="Reklam">
    {banner.link_url ? <a href={banner.link_url} target={banner.link_url.startsWith("/") ? undefined : "_blank"} rel={banner.link_url.startsWith("/") ? undefined : "noopener sponsored"} onClick={click}>{media}</a> : media}
  </aside>;
}
