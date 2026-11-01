"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, ImageDown, Share2, X } from "lucide-react";
import type { Listing } from "../../lib/marketplace";

// "Story üçün şəkil": the picture is prepared first and shown; "Paylaş" then opens the phone's share
// sheet straight from a tap (phones allow the share sheet only right after a tap), "Yüklə" saves it.
export default function StoryCard({ item }: { item: Listing }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState("");
  const [card, setCard] = useState<{ blob: Blob; url: string; file: File; share: boolean } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (card) dialog.current?.showModal(); }, [card]);
  useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);
  async function prepare() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { makeShareCard, cardFile, canShareFile } = await import("../../lib/share-card");
      const blob = await makeShareCard(item, window.location.origin.includes("localhost") ? "https://kirayeal.az" : window.location.origin);
      const file = cardFile(blob, item);
      setCard({ blob, url: URL.createObjectURL(blob), file, share: canShareFile(file) });
    } catch { setError("Şəkli hazırlamaq mümkün olmadı. Yenidən cəhd edin."); }
    finally { setBusy(false); }
  }
  async function share() {
    if (!card) return;
    try { await navigator.share({ files: [card.file], title: item.title }); }
    catch (problem) { if ((problem as Error)?.name !== "AbortError") setError("Paylaşmaq alınmadı — şəkli yükləyib story-də özünüz paylaşın."); }
  }
  async function download() {
    if (!card) return;
    const { downloadCard } = await import("../../lib/share-card");
    downloadCard(card.blob, card.file.name);
  }
  const close = () => { dialog.current?.close(); setCard(null); setError(""); };
  return <>
    <button type="button" className="kzButtonGhost" disabled={busy} onClick={() => void prepare()}><ImageDown aria-hidden="true" size={16} strokeWidth={1.75} />{busy ? "Hazırlanır…" : "Story üçün şəkil"}</button>
    {error && !card && <p className="kzFormError" role="alert">{error}</p>}
    {card && createPortal(<dialog ref={dialog} className="kzStoryDlg" aria-label="Story üçün şəkil" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }}>
      <div className="kzStoryBody">
        <header><strong>Story üçün şəkil</strong><button type="button" className="kzStoryClose" aria-label="Bağla" onClick={close}><X aria-hidden="true" size={20} strokeWidth={2} /></button></header>
        <img src={card.url} alt="Elanın story şəkli" />
        <p>Instagram, TikTok və ya WhatsApp story-də paylaşın. Şəkildəki QR kod elanınızı açır.</p>
        {error && <p className="kzFormError" role="alert">{error}</p>}
        <div className="kzStoryActions">
          {card.share && <button type="button" className="kzButton" onClick={() => void share()}><Share2 aria-hidden="true" size={17} strokeWidth={2} />Paylaş</button>}
          <button type="button" className={card.share ? "kzButtonGhost" : "kzButton"} onClick={() => void download()}><Download aria-hidden="true" size={17} strokeWidth={2} />Şəkli yüklə</button>
        </div>
      </div>
    </dialog>, document.body)}
  </>;
}
