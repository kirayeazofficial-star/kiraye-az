"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
type Banner = { id: string; title: string; image_url: string; media_type?: string; link_url: string | null };

// Tall banners in the empty space left and right of the page on wide computer screens (hidden elsewhere by CSS).
export default function SideBanners() {
  const [sides, setSides] = useState<{ left?: Banner; right?: Banner }>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!window.matchMedia("(min-width: 1536px)").matches) return;
    let active = true;
    const first = (placement: string) => fetch(`/api/banners?placement=${placement}`).then(r => r.json()).then(d => (d.items || [])[0] as Banner | undefined).catch(() => undefined);
    void Promise.all([first("left"), first("right")]).then(([left, right]) => { if (active) setSides({ left, right }); });
    return () => { active = false; };
  }, []);
  if (!mounted || (!sides.left && !sides.right)) return null;
  const click = (id: string) => { void fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), keepalive: true }).catch(() => {}); };
  const show = (banner: Banner | undefined, side: "left" | "right") => {
    if (!banner) return null;
    const media = banner.media_type === "video" || /\.(mp4|webm)$/i.test(banner.image_url) ? <video src={banner.image_url} aria-label={banner.title || "Reklam"} muted loop autoPlay playsInline preload="metadata" /> : <img src={banner.image_url} alt={banner.title || "Reklam"} />;
    return <aside className={`kzSideBanner ${side}`} aria-label="Reklam">
      {banner.link_url ? <a href={banner.link_url} target={banner.link_url.startsWith("/") ? undefined : "_blank"} rel={banner.link_url.startsWith("/") ? undefined : "noopener sponsored"} onClick={() => click(banner.id)}>{media}</a> : media}
      <small>Reklam</small>
    </aside>;
  };
  return createPortal(<>{show(sides.left, "left")}{show(sides.right, "right")}</>, document.body);
}
