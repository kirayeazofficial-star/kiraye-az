"use client";
import { useEffect, useRef, useState } from "react";
import { sized } from "../../lib/image-size";

// Keep the thumbnail visible until the bounded detail copy has actually decoded.
// The same element stays mounted as a neighbouring slide becomes the current one.
export default function GalleryPhoto({ src, alt, onDimensions }: {
  src: string; alt: string; onDimensions?: (width: number, height: number) => void;
}) {
  const full = sized(src, "view") || "/placeholder.svg";
  const [ready, setReady] = useState("");
  const [preview, setPreview] = useState("");
  const previewImage = useRef<HTMLImageElement>(null), fullImage = useRef<HTMLImageElement>(null);
  function showPhoto(node: HTMLImageElement) {
    const address = node.src;
    if (node.naturalWidth && node.naturalHeight) onDimensions?.(node.naturalWidth, node.naturalHeight);
    const show = () => { if (node.isConnected && node.src === address) setReady(full); };
    if (typeof node.decode === "function") void node.decode().then(show).catch(show); else show();
  }
  useEffect(() => {
    if (previewImage.current?.complete && previewImage.current.naturalWidth) setPreview(full);
    if (fullImage.current?.complete && fullImage.current.naturalWidth) showPhoto(fullImage.current);
  }, [full]);
  return <div className="kzGalleryPhoto">
    <img ref={previewImage} className="kzGalleryPreview" src={sized(src) || "/placeholder.svg"} alt="" aria-hidden="true" draggable={false}
      onLoad={() => setPreview(full)} onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/placeholder.svg"; }} />
    <img ref={fullImage} className="kzGalleryFull" src={full} alt={alt} draggable={false} loading="lazy" decoding="async" style={{ opacity: ready === full ? 1 : 0 }} onLoad={event => showPhoto(event.currentTarget)} />
    {ready !== full && preview !== full && <span className="kzGalleryLoading" role="status">Şəkil yüklənir…</span>}
  </div>;
}
