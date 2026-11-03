"use client";
import { useEffect, useId, useRef, useState, type CSSProperties } from "react";

export default function ExpandableText({ text, lines = 4, className = "" }: { text: string; lines?: number; className?: string }) {
  const [open, setOpen] = useState(false), [long, setLong] = useState(false);
  const paragraph = useRef<HTMLParagraphElement>(null), id = useId();
  useEffect(() => { setOpen(false); }, [text]);
  useEffect(() => {
    if (open) return;
    let live = true;
    const measure = () => { const node = paragraph.current; if (live && node) setLong(node.scrollHeight > node.clientHeight + 1); };
    measure();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(measure) : null;
    if (paragraph.current) observer?.observe(paragraph.current);
    void document.fonts?.ready.then(measure);
    window.addEventListener("resize", measure);
    return () => { live = false; observer?.disconnect(); window.removeEventListener("resize", measure); };
  }, [text, lines, open]);
  return <div className="kzExpandable" style={{ "--kz-text-lines": lines } as CSSProperties}>
    <p id={id} ref={paragraph} translate="no" className={`kzExpandableParagraph ${className}${open ? "" : " folded"}`}>{text}</p>
    {long && <button type="button" className="kzExpandButton" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)}>{open ? "Yığcam göstər" : "Tam mətn"}</button>}
  </div>;
}
