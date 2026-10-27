"use client";
import { useState } from "react";
import ImageViewer from "./ImageViewer";

export default function ModerationImages({images, title}: {images: string[]; title: string}) {
  const [index, setIndex] = useState<number | null>(null);
  return <>
    <div className="moderationImages">{images.map((src, i) => <button type="button" key={`${src}-${i}`}
      aria-label={`${i + 1}-ci şəkli böyüt`} onClick={() => setIndex(i)}>
      <img src={src} alt={title} loading="lazy"/>
    </button>)}</div>
    {index !== null && <ImageViewer images={images} title={title} index={index} onChange={setIndex} onClose={() => setIndex(null)}/>}
  </>;
}
