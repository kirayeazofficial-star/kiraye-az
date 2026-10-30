"use client";
import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type ListingPhoto = { id: string; src: string; file?: File };

// Photo grid of the listing form. Press and hold a photo (finger) or just drag it (mouse) to change
// the order; arrow keys work on a focused photo. The first photo is the cover shown on cards.
export default function PhotoOrganizer({ photos, onChange, removable = true }: { photos: ListingPhoto[]; onChange: (next: ListingPhoto[]) => void; removable?: boolean }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const grid = useRef<HTMLUListElement>(null);
  const latest = useRef(photos);
  latest.current = photos;
  const active = useRef<string | null>(null);
  const press = useRef<{ id: string; x: number; y: number; timer?: ReturnType<typeof setTimeout> } | null>(null);
  const move = (from: number, to: number) => {
    const list = latest.current;
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  const start = (id: string) => { active.current = id; setDragging(id); navigator.vibrate?.(10); };
  const finish = () => { if (press.current?.timer) clearTimeout(press.current.timer); press.current = null; active.current = null; setDragging(null); };
  // While a photo is being dragged the page must not scroll under the finger.
  useEffect(() => {
    const node = grid.current;
    const block = (event: TouchEvent) => { if (active.current) event.preventDefault(); };
    node?.addEventListener("touchmove", block, { passive: false });
    return () => node?.removeEventListener("touchmove", block);
  }, []);
  function down(event: React.PointerEvent<HTMLLIElement>, id: string) {
    if ((event.target as HTMLElement).closest("button")) return;
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer already gone */ }
    press.current = { id, x: event.clientX, y: event.clientY };
    if (event.pointerType !== "mouse") press.current.timer = setTimeout(() => start(id), 280);
  }
  function over(event: React.PointerEvent) {
    const held = press.current;
    if (!held) return;
    const distance = Math.hypot(event.clientX - held.x, event.clientY - held.y);
    if (!active.current) {
      if (event.pointerType === "mouse" && distance > 4) start(held.id);
      else if (event.pointerType !== "mouse" && distance > 8) { finish(); return; } // it was a scroll, not a hold
      if (!active.current) return;
    }
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-photo-id]");
    const to = target ? latest.current.findIndex(photo => photo.id === target.dataset.photoId) : -1;
    if (to >= 0) move(latest.current.findIndex(photo => photo.id === active.current), to);
  }
  return <ul ref={grid} className={`kzPhotoGrid${dragging ? " sorting" : ""}`} aria-label="Elanın şəkilləri. Yerini dəyişmək üçün şəkli basıb saxlayın və sürüşdürün.">
    {photos.map((photo, index) => <li key={photo.id} data-photo-id={photo.id} tabIndex={0}
      className={`kzPhotoTile${dragging === photo.id ? " lifted" : ""}`}
      aria-label={`${index + 1}-ci şəkil${index === 0 ? ", əsas şəkil" : ""}. Oxlarla yerini dəyişin.`}
      onPointerDown={event => down(event, photo.id)} onPointerMove={over} onPointerUp={finish} onPointerCancel={finish}
      onContextMenu={event => event.preventDefault()}
      onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(index, index - 1); } if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(index, index + 1); } }}>
      <img src={photo.src} alt="" draggable={false} />
      {removable && <button type="button" className="kzPhotoRemove" aria-label={`${index + 1}-ci şəkli sil`} onClick={() => onChange(photos.filter(item => item.id !== photo.id))}>
        <X aria-hidden="true" size={13} strokeWidth={2.75} />
      </button>}
    </li>)}
  </ul>;
}
