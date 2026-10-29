"use client";
import { GripVertical, X } from "lucide-react";
import { useRef, useState } from "react";

export type ListingPhoto = { id: string; src: string; file?: File };

// Photo grid of the listing form: drag a photo by its handle (finger or mouse) to change the order,
// "Əsas et" moves it to the front. The first photo is the cover shown on cards.
export default function PhotoOrganizer({ photos, onChange }: { photos: ListingPhoto[]; onChange: (next: ListingPhoto[]) => void }) {
  const [dragging, setDragging] = useState<string | null>(null);
  const latest = useRef(photos);
  latest.current = photos;
  const move = (from: number, to: number) => {
    const list = latest.current;
    if (from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };
  function down(event: React.PointerEvent, id: string) {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(id);
  }
  function over(event: React.PointerEvent) {
    if (!dragging) return;
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLElement>("[data-photo-id]");
    const to = target ? latest.current.findIndex(photo => photo.id === target.dataset.photoId) : -1;
    if (to >= 0) move(latest.current.findIndex(photo => photo.id === dragging), to);
  }
  const stop = () => setDragging(null);
  return <ul className={`kzPhotoGrid${dragging ? " sorting" : ""}`} aria-label="Elanın şəkilləri">
    {photos.map((photo, index) => <li key={photo.id} data-photo-id={photo.id} className={`kzPhotoTile${dragging === photo.id ? " lifted" : ""}`}>
      <img src={photo.src} alt={`${index + 1}-ci şəkil`} draggable={false} />
      <button type="button" className="kzPhotoHandle" aria-label={`${index + 1}-ci şəkli sürüşdür (oxlarla da yerini dəyişmək olar)`}
        onPointerDown={event => down(event, photo.id)} onPointerMove={over} onPointerUp={stop} onPointerCancel={stop}
        onKeyDown={event => { if (event.key === "ArrowLeft" || event.key === "ArrowUp") { event.preventDefault(); move(index, index - 1); } if (event.key === "ArrowRight" || event.key === "ArrowDown") { event.preventDefault(); move(index, index + 1); } }}>
        <GripVertical aria-hidden="true" size={16} strokeWidth={2.25} />
      </button>
      <button type="button" className="kzPhotoRemove" aria-label={`${index + 1}-ci şəkli sil`} onClick={() => onChange(photos.filter(item => item.id !== photo.id))}>
        <X aria-hidden="true" size={15} strokeWidth={2.5} />
      </button>
      {index === 0 ? <span className="kzPhotoCover">Əsas şəkil</span>
        : <button type="button" className="kzPhotoMakeCover" onClick={() => move(index, 0)}>Əsas et</button>}
    </li>)}
  </ul>;
}
