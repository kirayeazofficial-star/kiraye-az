"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
type Banner = { id: string; title: string; image_url: string; media_type?: string; link_url: string | null };

// One tall advert shown in the empty space both left and right of the page on wide computer screens (hidden elsewhere by CSS).
export default function SideBanners() {
  const [sides, setSides] = useState<{ left?: Banner; right?: Banner }>({});
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    if (!window.matchMedia("(min-width: 1536px)").matches) return;
    let active = true;
    fetch("/api/banners?placement=side").then(r => r.json()).then(d => { const banner = (d.items || [])[0] as Banner | undefined; if (active) setSides({ left: banner, right: banner }); }).catch(() => {});
    return () => { active = false; };
  }, []);
  // Start just below the header (and below the top advert strip while it is in view).
  useEffect(() => {
    if (!sides.left && !sides.right) return;
    // Banners sit only in the real free space beside the page content (measured, so a scrollbar or a
    // wider header never lets them cover the page); too little space hides them.
    const place = () => {
      const root = document.documentElement, width = root.clientWidth;
      const bottom = document.querySelector(".kzHeader")?.getBoundingClientRect().bottom ?? 76;
      root.style.setProperty("--kz-side-top", `${Math.max(16, Math.round(bottom) + 20)}px`);
      let left = width, right = 0;
      document.querySelectorAll(".kzHeaderInner, main, main > .wrap, footer .wrap").forEach(node => {
        const box = node.getBoundingClientRect();
        if (box.width && box.width < width - 8) { left = Math.min(left, box.left); right = Math.max(right, box.right); }
      });
      if (right <= left) { left = (width - 1280) / 2; right = width - left; }
      // Tall 1:3 adverts also have to fit in the window height, never cropped.
      const gap = 16, free = Math.min(left, width - right) - gap * 2, tall = (window.innerHeight - Math.max(16, bottom + 20) - 40) / 3;
      const size = Math.min(200, Math.floor(free), Math.floor(tall));
      root.style.setProperty("--kz-side-w", `${Math.max(0, size)}px`);
      root.style.setProperty("--kz-side-left", `${Math.round((left - size) / 2)}px`);
      root.style.setProperty("--kz-side-right-left", `${Math.round(right + (width - right - size) / 2)}px`);
      root.classList.toggle("kzSideOff", size < 120);
    };
    place();
    const observer = new ResizeObserver(place); observer.observe(document.body); // e.g. the top advert finished loading
    window.addEventListener("scroll", place, { passive: true }); window.addEventListener("resize", place);
    return () => { observer.disconnect(); window.removeEventListener("scroll", place); window.removeEventListener("resize", place); };
  }, [sides]);
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
