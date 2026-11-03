"use client";
import QRCode from "qrcode";
import { money, periodName, type Listing } from "./marketplace";

// A ready picture for Instagram / TikTok / WhatsApp story (1080×1920, 9:16): the photo with a small QR code
// in its corner (opens the listing), then title, city and price. Drawn in the browser, nothing is uploaded.
// Rounded rectangle that also works on older Safari (no CanvasRenderingContext2D.roundRect there).
function rounded(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}
export async function makeShareCard(item: Listing, site = "https://kirayeal.az"): Promise<Blob> {
  const W = 1080, H = 1920, canvas = document.createElement("canvas");
  canvas.width = W; canvas.height = H;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("canvas");
  await Promise.race([document.fonts?.ready, new Promise(resolve => setTimeout(resolve, 1500))]);
  const family = getComputedStyle(document.body).fontFamily || "Inter, Arial, sans-serif";
  c.fillStyle = "#ffffff"; c.fillRect(0, 0, W, H);

  // Photo, cropped to fill the top. Nothing is drawn over it except a small QR square in the corner.
  const photoH = 1240;
  const src = item.images?.[0];
  const img = src ? await new Promise<HTMLImageElement | null>(resolve => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; setTimeout(() => resolve(null), 8000); }) : null;
  if (img && img.naturalWidth) {
    const scale = Math.max(W / img.naturalWidth, photoH / img.naturalHeight), w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    // Clip to the photo area: a tall photo must never spill over the title below it.
    c.save(); c.beginPath(); c.rect(0, 0, W, photoH); c.clip();
    c.drawImage(img, (W - w) / 2, (photoH - h) / 2, w, h);
    c.restore();
  } else { c.fillStyle = "#f3f4f6"; c.fillRect(0, 0, W, photoH); }

  // QR code that opens the listing: a small white square in the top-right corner of the photo.
  const qr = document.createElement("canvas"), qrSize = 168, box = qrSize + 24;
  await QRCode.toCanvas(qr, `${site}/listings/${item.id}`, { margin: 1, width: qrSize, color: { dark: "#13312e", light: "#ffffff" } });
  c.fillStyle = "#ffffff"; rounded(c, W - 48 - box, 48, box, box, 18); c.fill();
  c.drawImage(qr, W - 48 - box + 12, 60, qrSize, qrSize);

  // Below the photo: title (three lines at most), city and the price.
  c.fillStyle = "#111827"; c.font = `700 60px ${family}`; c.textBaseline = "top";
  const words = item.title.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > W - 112 && line) { lines.push(line); line = word; if (lines.length === 3) break; } else line = next;
  }
  if (lines.length < 3 && line) lines.push(line);
  if (lines.length === 3 && words.join(" ").length > lines.join(" ").length) lines[2] = `${lines[2].replace(/\s*\S*$/, "")}…`;
  let y = photoH + 52;
  lines.forEach(text => { c.fillText(text, 56, y); y += 74; });
  c.fillStyle = "#6b7280"; c.font = `500 40px ${family}`;
  c.fillText(`${item.city}${item.district ? `, ${item.district}` : ""}`, 56, y + 10);
  y += 82;
  const price = `${money(item.price)} ₼`, unit = ` / ${periodName(item.rental_period)}`;
  c.fillStyle = "#ff5a1f"; c.font = `800 64px ${family}`; c.fillText(price, 56, y);
  const priceW = c.measureText(price).width;
  c.fillStyle = "#6b7280"; c.font = `600 40px ${family}`; c.fillText(unit, 56 + priceW, y + 20);

  // Bottom bar: brand on the left, short line on the right.
  const barH = 190, barY = H - barH;
  c.fillStyle = "#13312e"; c.fillRect(0, barY, W, barH);
  c.textBaseline = "middle"; c.font = `800 68px ${family}`;
  c.fillStyle = "#ffffff"; c.fillText("kirayeal", 56, barY + barH / 2);
  const brandW = c.measureText("kirayeal").width;
  c.fillStyle = "#ff7a33"; c.fillText(".az", 56 + brandW, barY + barH / 2);
  c.fillStyle = "rgba(255,255,255,0.78)"; c.font = `500 34px ${family}`; c.textAlign = "right";
  c.fillText("Azərbaycanda kirayə elanları", W - 56, barY + barH / 2);
  c.textAlign = "left";

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("image")), "image/jpeg", 0.9));
}

// The prepared picture as a file (for the share sheet) and a download (where sharing is not possible).
export const cardFile = (blob: Blob, item: Listing) => new File([blob], `kirayeal-${item.listing_no || "elan"}-story.jpg`, { type: "image/jpeg" });
export const canShareFile = (file: File) => typeof navigator !== "undefined" && !!navigator.canShare?.({ files: [file] });
export function downloadCard(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
