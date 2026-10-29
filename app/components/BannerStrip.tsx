"use client";
import { useEffect, useRef, useState } from "react";
type Banner = { id: string; title: string; image_url: string; link_url: string | null };
// Shows active banners for a placement; several banners can be swiped, with dots below.
export default function BannerStrip({ placement }: { placement: "home" | "listing" }) {
  const [items, setItems] = useState<Banner[]>([]), [index, setIndex] = useState(0);
  const rail = useRef<HTMLDivElement>(null);
  useEffect(() => { let active = true; fetch(`/api/banners?placement=${placement}`).then(r => r.json()).then(d => { if (active) setItems(d.items || []); }).catch(() => {}); return () => { active = false; }; }, [placement]);
  if (!items.length) return null;
  const click = (id: string) => { void fetch("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }), keepalive: true }).catch(() => {}); };
  return <section className={`kzBanners ${placement}`} aria-label="Reklam">
    <div className="kzBannerRail" ref={rail} onScroll={event => { const el = event.currentTarget; setIndex(Math.round(el.scrollLeft / el.clientWidth)); }}>
      {items.map(banner => {
        const image = <img src={banner.image_url} alt={banner.title || "Reklam"} loading="lazy" />;
        return banner.link_url ? <a key={banner.id} href={banner.link_url} target={banner.link_url.startsWith("/") ? undefined : "_blank"} rel={banner.link_url.startsWith("/") ? undefined : "noopener sponsored"} onClick={() => click(banner.id)}>{image}</a> : <div key={banner.id}>{image}</div>;
      })}
    </div>
    {items.length > 1 && <div className="kzBannerDots">{items.map((banner, dot) => <button key={banner.id} type="button" aria-label={`${dot + 1}-ci banner`} aria-current={dot === index} onClick={() => rail.current?.scrollTo({ left: dot * rail.current.clientWidth, behavior: "smooth" })} />)}</div>}
    <small className="kzBannerTag">Reklam</small>
  </section>;
}
