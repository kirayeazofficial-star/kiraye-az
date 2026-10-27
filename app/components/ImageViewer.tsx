"use client";

import { useEffect, useRef } from "react";

/** Uses the dialog top layer, so sticky headers and adverts cannot cover photos. */
export default function ImageViewer({ images, title, index, onChange, onClose }: {
  images: string[]; title: string; index: number;
  onChange: (index: number) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const start = useRef<{x: number; y: number} | null>(null);
  const current = Math.min(index, Math.max(0, images.length - 1));
  const move = (delta: number) => onChange((current + delta + images.length) % images.length);
  useEffect(() => {
    const node = dialog.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    node?.showModal();
    return () => {
      node?.close(); document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, []);
  return <dialog ref={dialog} className="imageViewer" aria-label={`${title} — şəkillər`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target === event.currentTarget) onClose(); }}
    onKeyDown={event => {
      if (images.length > 1 && ["ArrowLeft", "ArrowRight"].includes(event.key)) {
        event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1);
      }
    }}>
    <div className="imageViewerContent">
      <header><span>{title}</span><button type="button" onClick={onClose} aria-label="Şəkilləri bağla">✕</button></header>
      <div className="imageViewerStage"
        onTouchStart={event => {
          const touch = event.touches.length === 1 ? event.touches[0] : null;
          start.current = touch ? {x: touch.clientX, y: touch.clientY} : null;
        }}
        onTouchMove={event => { if (event.touches.length !== 1) start.current = null; }}
        onTouchCancel={() => { start.current = null; }}
        onTouchEnd={event => {
          const origin = start.current, touch = event.changedTouches[0]; start.current = null;
          if (!origin || !touch || images.length < 2 || (window.visualViewport?.scale ?? 1) > 1.05) return;
          const dx = touch.clientX - origin.x, dy = touch.clientY - origin.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.25) move(dx < 0 ? 1 : -1);
        }}>
        <img src={images[current] || "/placeholder.svg"} alt={`${title} — ${current + 1}-ci şəkil`} draggable={false}
          onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/placeholder.svg"; }}/>
      </div>
      <footer>
        {images.length > 1 && <button type="button" onClick={() => move(-1)} aria-label="Əvvəlki böyük şəkil">‹</button>}
        <span role="status">{current + 1} / {images.length}</span>
        {images.length > 1 && <button type="button" onClick={() => move(1)} aria-label="Növbəti böyük şəkil">›</button>}
      </footer>
    </div>
  </dialog>;
}
