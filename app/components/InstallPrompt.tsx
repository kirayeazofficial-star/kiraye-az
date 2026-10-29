"use client";
import { Share, SquarePlus, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
const HIDE_KEY = "kiraye:install-hidden";
const HIDE_DAYS = 30;

// Thin strip at the top of the page on phones: "add kirayeal.az to the home screen".
// Android/Chrome gets the browser's own install dialog; iPhone (no such dialog) gets short steps.
// ✕ hides it for 30 days; it never shows inside the installed app.
export default function InstallPrompt() {
  const [mode, setMode] = useState<"android" | "ios" | "other" | null>(null);
  const [steps, setSteps] = useState(false);
  const installEvent = useRef<InstallEvent | null>(null);
  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {});
    const installed = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    const phone = window.matchMedia("(max-width: 767px)").matches && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let hiddenUntil = 0;
    try { hiddenUntil = Number(localStorage.getItem(HIDE_KEY)) || 0; } catch {}
    if (installed || !phone || hiddenUntil > Date.now()) return;
    const ios = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (ios) { setMode("ios"); return; }
    const capture = (event: Event) => { event.preventDefault(); installEvent.current = event as InstallEvent; setMode("android"); };
    window.addEventListener("beforeinstallprompt", capture);
    // Browsers without the install dialog (some Android browsers) still get the manual steps.
    const fallback = setTimeout(() => setMode(current => current ?? "other"), 2500);
    const done = () => setMode(null);
    window.addEventListener("appinstalled", done);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("appinstalled", done); clearTimeout(fallback); };
  }, []);
  function hide() {
    try { localStorage.setItem(HIDE_KEY, String(Date.now() + HIDE_DAYS * 86400000)); } catch {}
    setMode(null); setSteps(false);
  }
  async function add() {
    const event = installEvent.current;
    if (mode === "android" && event) {
      await event.prompt();
      const choice = await event.userChoice.catch(() => ({ outcome: "dismissed" }));
      installEvent.current = null;
      if (choice.outcome === "accepted") setMode(null);
      return;
    }
    setSteps(true);
  }
  if (!mode) return null;
  return <>
    <div className="kzInstall" role="region" aria-label="Tətbiqi telefona əlavə et">
      <button type="button" className="kzInstallClose" aria-label="Bağla" onClick={hide}><X aria-hidden="true" size={16} strokeWidth={2.25} /></button>
      <img src="/icon-192.png" alt="" width={36} height={36} />
      <span className="kzInstallText"><strong>kirayeal.az tətbiqi</strong><small>Ekrana əlavə et, tətbiq kimi aç</small></span>
      <button type="button" className="kzInstallAdd" onClick={() => void add()}>Əlavə et</button>
    </div>
    {steps && <div className="kzInstallSheet" role="dialog" aria-modal="true" aria-labelledby="kz-install-title" onClick={event => { if (event.target === event.currentTarget) setSteps(false); }}>
      <div className="kzInstallCard">
        <button type="button" className="kzInstallClose" aria-label="Bağla" onClick={() => setSteps(false)}><X aria-hidden="true" size={18} strokeWidth={2.25} /></button>
        <img src="/icon-192.png" alt="" width={56} height={56} />
        <h2 id="kz-install-title">Telefona necə əlavə etmək olar</h2>
        {mode === "ios" ? <ol>
          <li><span className="kzInstallNo">1</span><span>Ünvan sətrinin yanındakı <b>•••</b> və ya <b>Paylaş</b> <Share aria-hidden="true" size={18} strokeWidth={2} /> düyməsinə toxun</span></li>
          <li><span className="kzInstallNo">2</span><span><b>“Ana ekrana əlavə et”</b> seç <SquarePlus aria-hidden="true" size={18} strokeWidth={2} /> (görünmürsə, əvvəl “Paylaş”)</span></li>
          <li><span className="kzInstallNo">3</span><span>Yuxarıda <b>“Əlavə et”</b> düyməsinə toxun</span></li>
        </ol> : <ol>
          <li><span className="kzInstallNo">1</span><span>Brauzerin menyusunu aç (yuxarıda <b>⋮</b>)</span></li>
          <li><span className="kzInstallNo">2</span><span><b>“Ana ekrana əlavə et”</b> və ya <b>“Tətbiqi quraşdır”</b> seç</span></li>
          <li><span className="kzInstallNo">3</span><span><b>“Əlavə et”</b> ilə təsdiqlə</span></li>
        </ol>}
        <p>Sonra kirayeal.az telefonun ekranında öz ikonu ilə görünəcək.</p>
        <button type="button" className="kzButton" onClick={() => setSteps(false)}>Başa düşdüm</button>
      </div>
    </div>}
  </>;
}
