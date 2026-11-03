"use client";
import QRCode from "qrcode";
import { money, periodName, type Listing } from "./marketplace";

// A ready picture for Instagram / TikTok / WhatsApp story (1080×1920, 9:16): brand, the photo as a rounded
// card, title, place and price, and a QR code (opens the listing) in a white panel at the bottom. Drawn in the browser, nothing is uploaded.
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
  // Layout: soft background, brand on top, the photo as a rounded card, then title, place and price,
  // and at the bottom a white panel with a QR code that opens the listing.
  const M = 64, ink = "#111827", muted = "#6b7280";
  c.fillStyle = "#f4f5f7"; c.fillRect(0, 0, W, H);

  // Brand.
  c.textBaseline = "middle"; c.font = `800 52px ${family}`;
  c.fillStyle = "#143f3b"; c.fillText("kirayeal", M, 104);
  const brandW = c.measureText("kirayeal").width;
  c.fillStyle = "#ff5a1f"; c.fillText(".az", M + brandW, 104);
  c.fillStyle = muted; c.font = `500 30px ${family}`; c.textAlign = "right";
  c.fillText("Kirayə elanı", W - M, 106); c.textAlign = "left";

  // Photo card.
  const photoY = 172, photoH = 1040, photoW = W - 2 * M;
  const src = item.images?.[0];
  const img = src ? await new Promise<HTMLImageElement | null>(resolve => { const i = new Image(); i.crossOrigin = "anonymous"; i.onload = () => resolve(i); i.onerror = () => resolve(null); i.src = src; setTimeout(() => resolve(null), 8000); }) : null;
  c.save(); rounded(c, M, photoY, photoW, photoH, 36); c.clip();
  if (img && img.naturalWidth) {
    const scale = Math.max(photoW / img.naturalWidth, photoH / img.naturalHeight), w = img.naturalWidth * scale, h = img.naturalHeight * scale;
    c.drawImage(img, M + (photoW - w) / 2, photoY + (photoH - h) / 2, w, h);
  } else { c.fillStyle = "#e5e7eb"; c.fillRect(M, photoY, photoW, photoH); }
  c.restore();

  // Title (two lines at most), place and price.
  c.textBaseline = "top"; c.fillStyle = ink; c.font = `700 58px ${family}`;
  const words = item.title.split(/\s+/), lines: string[] = [];
  let line = "";
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (c.measureText(next).width > W - 2 * M && line) { lines.push(line); line = word; if (lines.length === 2) break; } else line = next;
  }
  if (lines.length < 2 && line) lines.push(line);
  if (lines.length === 2 && words.join(" ").length > lines.join(" ").length) lines[1] = `${lines[1].replace(/\s*\S*$/, "")}…`;
  let y = photoY + photoH + 52;
  lines.forEach(text => { c.fillText(text, M, y); y += 72; });
  c.fillStyle = muted; c.font = `500 38px ${family}`;
  c.fillText(`${item.city}${item.district ? `, ${item.district}` : ""}`, M, y + 8);
  y += 70;
  const price = `${money(item.price)} ₼`, unit = ` / ${periodName(item.rental_period)}`;
  c.fillStyle = "#ff5a1f"; c.font = `800 62px ${family}`; c.fillText(price, M, y);
  const priceW = c.measureText(price).width;
  c.fillStyle = muted; c.font = `600 38px ${family}`; c.fillText(unit, M + priceW, y + 20);

  // Bottom panel with the QR code.
  const panelH = 236, panelY = H - M - panelH, qrSize = 180;
  c.fillStyle = "#ffffff"; rounded(c, M, panelY, W - 2 * M, panelH, 32); c.fill();
  const qr = document.createElement("canvas");
  await QRCode.toCanvas(qr, `${site}/listings/${item.id}`, { margin: 0, width: qrSize, color: { dark: "#111827", light: "#ffffff" } });
  c.drawImage(qr, W - M - 28 - qrSize, panelY + (panelH - qrSize) / 2, qrSize, qrSize);
  c.textBaseline = "middle"; c.fillStyle = ink; c.font = `700 40px ${family}`;
  c.fillText("Elana baxmaq üçün", M + 40, panelY + 82);
  c.fillText("QR kodu skan edin", M + 40, panelY + 132);
  c.fillStyle = muted; c.font = `500 30px ${family}`;
  c.fillText(`kirayeal.az${item.listing_no ? ` · № ${item.listing_no}` : ""}`, M + 40, panelY + 184);

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
