"use client";
import QRCode from "qrcode";
import { money, periodName, type Listing } from "./marketplace";

// A ready picture for Instagram / WhatsApp status (1080×1350): the photo, price, title, city and
// a QR code that opens the listing. Drawn in the browser, nothing is uploaded.
export async function makeShareCard(item: Listing, site = "https://kirayeal.az"): Promise<Blob> {
  const W = 1080, H = 1350, canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("canvas");
  await document.fonts?.ready;
  const family = getComputedStyle(document.body).fontFamily || "Inter, Arial, sans-serif";
  c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);

  // Photo, cropped to fill the top.
  const photoH = 820;
  const src = item.images?.[0];
  if (src) {
    const img = await new Promise<HTMLImageElement | null>(resolve => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; });
    if (img) {
      const scale = Math.max(W / img.naturalWidth, photoH / img.naturalHeight), w = img.naturalWidth * scale, h = img.naturalHeight * scale;
      c.drawImage(img, (W - w) / 2, (photoH - h) / 2, w, h);
    }
  } else { c.fillStyle = "#f3f4f6"; c.fillRect(0, 0, W, photoH); }

  // Price tag over the photo.
  c.font = `800 64px ${family}`;
  const price = `${money(item.price)} ₼`, unit = ` / ${periodName(item.rental_period)}`;
  const priceW = c.measureText(price).width; c.font = `600 40px ${family}`; const unitW = c.measureText(unit).width;
  const tagW = priceW + unitW + 64, tagY = photoH - 70;
  c.fillStyle = "#ff5a1f"; c.beginPath(); c.roundRect(48, tagY - 50, tagW, 100, 50); c.fill();
  c.fillStyle = "#ffffff"; c.textBaseline = "middle";
  c.font = `800 64px ${family}`; c.fillText(price, 80, tagY + 2);
  c.font = `600 40px ${family}`; c.fillText(unit, 80 + priceW, tagY + 6);

  // Title (two lines at most) and city.
  c.fillStyle = "#111827"; c.font = `700 54px ${family}`; c.textBaseline = "top";
  const words = item.title.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > W - 96 && line) { lines.push(line); line = word; if (lines.length === 2) break; } else line = next;
  }
  if (lines.length < 2 && line) lines.push(line);
  if (lines.length === 2 && words.join(" ").length > lines.join(" ").length) lines[1] = `${lines[1].replace(/\s*\S*$/, "")}…`;
  lines.forEach((text, i) => c.fillText(text, 48, photoH + 44 + i * 66));
  c.fillStyle = "#6b7280"; c.font = `500 38px ${family}`;
  c.fillText(`${item.city}${item.district ? `, ${item.district}` : ""} · kirayə`, 48, photoH + 44 + lines.length * 66 + 14);

  // Bottom bar: brand and QR code.
  const barY = H - 250;
  c.fillStyle = "#13312e"; c.fillRect(0, barY, W, 250);
  c.textBaseline = "middle"; c.font = `800 72px ${family}`;
  c.fillStyle = "#ffffff"; c.fillText("kirayeal", 48, barY + 100);
  const brandW = c.measureText("kirayeal").width;
  c.fillStyle = "#ff7a33"; c.fillText(".az", 48 + brandW, barY + 100);
  c.fillStyle = "rgba(255,255,255,0.75)"; c.font = `500 34px ${family}`;
  c.fillText("Kirayə üçün skan et və bax", 48, barY + 172);
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, `${site}/listings/${item.id}`, { margin: 1, width: 190, color: { dark: "#13312e", light: "#ffffff" } });
  c.fillStyle = "#ffffff"; c.beginPath(); c.roundRect(W - 48 - 206, barY + 22, 206, 206, 18); c.fill();
  c.drawImage(qr, W - 48 - 198, barY + 30, 190, 190);

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("image")), "image/jpeg", 0.9));
}

// Share the picture on the phone (WhatsApp, Instagram…); where that is not possible, download it.
export async function shareCard(item: Listing) {
  const blob = await makeShareCard(item, window.location.origin.includes("localhost") ? "https://kirayeal.az" : window.location.origin);
  const file = new File([blob], `kirayeal-${item.listing_no || "elan"}.jpg`, { type: "image/jpeg" });
  if (navigator.canShare?.({ files: [file] })) { try { await navigator.share({ files: [file], title: item.title }); return; } catch { /* closed: fall back to download */ } }
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = file.name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
