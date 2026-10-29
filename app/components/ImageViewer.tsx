"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type View = { scale: number; x: number; y: number };
const still: View = { scale: 1, x: 0, y: 0 };
const MAX = 4;

/** Full-screen photo viewer (dialog top layer): swipe between photos, pinch or double-tap to zoom, drag to look around. */
export default function ImageViewer({ images, title, index, onChange, onClose }: {
  images: string[]; title: string; index: number;
  onChange: (index: number) => void; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ distance: number; scale: number; startX: number; startY: number; view: View; moved: boolean } | null>(null);
  const lastTap = useRef<{ time: number; x: number; y: number } | null>(null);
  const [view, setView] = useState<View>(still);
  const [drag, setDrag] = useState(0);
  const [animate, setAnimate] = useState(true);
  const current = Math.min(index, Math.max(0, images.length - 1));
  const many = images.length > 1;
  const move = (delta: number) => { setView(still); onChange((current + delta + images.length) % images.length); };

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
  useEffect(() => { setView(still); setDrag(0); }, [current]);
  // Keep the active thumbnail in sight.
  useEffect(() => { dialog.current?.querySelector(".kzViewerThumbs [aria-current=true]")?.scrollIntoView({ block: "nearest", inline: "center" }); }, [current]);

  // Limits panning so the photo never leaves the screen.
  function clamp(next: View): View {
    const box = stage.current?.getBoundingClientRect();
    if (!box || next.scale <= 1) return still;
    const limitX = (box.width * (next.scale - 1)) / 2, limitY = (box.height * (next.scale - 1)) / 2;
    return { scale: next.scale, x: Math.max(-limitX, Math.min(limitX, next.x)), y: Math.max(-limitY, Math.min(limitY, next.y)) };
  }
  // Zooms towards a point on the screen (or the centre).
  function zoomTo(scale: number, clientX?: number, clientY?: number) {
    const box = stage.current?.getBoundingClientRect();
    if (!box || scale <= 1) { setView(still); return; }
    const dx = (clientX ?? box.left + box.width / 2) - (box.left + box.width / 2);
    const dy = (clientY ?? box.top + box.height / 2) - (box.top + box.height / 2);
    setAnimate(true);
    setView(clamp({ scale, x: -dx * (scale - 1), y: -dy * (scale - 1) }));
  }

  function down(event: React.PointerEvent) {
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()];
    setAnimate(false);
    gesture.current = {
      distance: points.length > 1 ? Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) : 0,
      scale: view.scale, startX: event.clientX, startY: event.clientY, view, moved: false,
    };
  }
  function moveTouch(event: React.PointerEvent) {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return;
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    const points = [...pointers.current.values()], g = gesture.current;
    if (points.length > 1 && g.distance) {
      g.moved = true;
      const scale = Math.max(1, Math.min(MAX, g.scale * Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y) / g.distance));
      setView(clamp({ ...g.view, scale }));
      return;
    }
    const dx = event.clientX - g.startX, dy = event.clientY - g.startY;
    if (Math.abs(dx) > 6 || Math.abs(dy) > 6) g.moved = true;
    if (view.scale > 1) setView(clamp({ scale: g.view.scale, x: g.view.x + dx, y: g.view.y + dy }));
    else if (many) setDrag(dx);
  }
  function up(event: React.PointerEvent) {
    pointers.current.delete(event.pointerId);
    const g = gesture.current;
    if (pointers.current.size) { // one finger left after a pinch: continue as a drag from here
      const rest = [...pointers.current.values()][0];
      gesture.current = { distance: 0, scale: view.scale, startX: rest.x, startY: rest.y, view, moved: true };
      return;
    }
    gesture.current = null;
    setAnimate(true);
    if (view.scale < 1.05) setView(still);
    if (drag) {
      const width = stage.current?.clientWidth || 1;
      setDrag(0);
      if (Math.abs(drag) > Math.min(80, width * 0.18)) move(drag < 0 ? 1 : -1);
      return;
    }
    if (g?.moved) return;
    // Double tap / double click toggles zoom at that point.
    const now = Date.now(), tap = lastTap.current;
    if (tap && now - tap.time < 300 && Math.hypot(tap.x - event.clientX, tap.y - event.clientY) < 30) {
      lastTap.current = null;
      if (view.scale > 1) setView(still); else zoomTo(2.5, event.clientX, event.clientY);
    } else lastTap.current = { time: now, x: event.clientX, y: event.clientY };
  }

  return <dialog ref={dialog} className="imageViewer kzViewer" aria-label={`${title} — şəkillər`}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onKeyDown={event => {
      if (many && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
      if (event.key === "+" || event.key === "=") zoomTo(Math.min(MAX, view.scale + 1));
      if (event.key === "-") zoomTo(view.scale - 1);
    }}>
    <div className="kzViewerTop">
      <span className="kzViewerCount" role="status">{current + 1} / {images.length}</span>
      <div className="kzViewerTools">
        <button type="button" onClick={onClose} aria-label="Şəkilləri bağla"><X aria-hidden="true" size={22} strokeWidth={2} /></button>
      </div>
    </div>
    <div ref={stage} className={`kzViewerStage${view.scale > 1 ? " zoomed" : ""}`}
      onPointerDown={down} onPointerMove={moveTouch} onPointerUp={up} onPointerCancel={up}
      onWheel={event => { if (event.ctrlKey || Math.abs(event.deltaY) > 0) { zoomTo(Math.max(1, Math.min(MAX, view.scale * (event.deltaY < 0 ? 1.25 : 0.8))), event.clientX, event.clientY); } }}>
      <img src={images[current] || "/placeholder.svg"} alt={`${title} — ${current + 1}-ci şəkil`} draggable={false}
        style={{ transform: `translate3d(${view.x + drag}px, ${view.y}px, 0) scale(${view.scale})`, transition: animate ? "transform .22s ease" : "none" }}
        onError={event => { event.currentTarget.onerror = null; event.currentTarget.src = "/placeholder.svg"; }}/>
      {many && view.scale === 1 && <>
        <button type="button" className="kzViewerArrow previous" onPointerDown={event => event.stopPropagation()} onClick={() => move(-1)} aria-label="Əvvəlki şəkil"><ChevronLeft aria-hidden="true" size={26} strokeWidth={2} /></button>
        <button type="button" className="kzViewerArrow next" onPointerDown={event => event.stopPropagation()} onClick={() => move(1)} aria-label="Növbəti şəkil"><ChevronRight aria-hidden="true" size={26} strokeWidth={2} /></button>
      </>}
    </div>
    <div className="kzViewerBottom">
      {many && <div className="kzViewerThumbs">{images.map((src, i) => <button key={src + i} type="button" aria-current={i === current} aria-label={`${i + 1}-ci şəkil`} onClick={() => { setView(still); onChange(i); }}><img src={src} alt="" draggable={false} /></button>)}</div>}
      <p className="kzViewerHint">{view.scale > 1 ? "Baxmaq üçün sürüşdürün · iki dəfə toxunun — kiçilt" : "İki dəfə toxunun və ya iki barmaqla böyüdün"}</p>
    </div>
  </dialog>;
}
