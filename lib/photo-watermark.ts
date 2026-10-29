export async function watermarkPhoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Şəkli oxumaq mümkün olmadı.")); image.src = url; });
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("Şəklin ölçüsü çox böyükdür. Daha kiçik şəkil seç.");
    const scale = Math.min(1, 2560 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Şəkli hazırlamaq mümkün olmadı.");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    await document.fonts?.load(`900 32px ${brandFamily()}`).catch(() => undefined);
    drawBrandMark(context, canvas.width, canvas.height);
    // Sharp enough to zoom in on, but always under the 5 MB upload limit.
    const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Şəkli hazırlamaq mümkün olmadı.")), "image/jpeg", quality));
    let blob = await encode(0.92);
    for (const quality of [0.86, 0.8, 0.72]) { if (blob.size <= 4.5 * 1024 * 1024) break; blob = await encode(quality); }
    return new File([blob], `branded-${file.name}.jpg`, { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}

// Small copy of a (branded) photo for link previews in WhatsApp/Telegram/Facebook: they skip images
// that are several megabytes, so shares get a ~1200px JPEG of roughly 100–250 KB.
export async function sharePreview(file: Blob): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("preview")); image.src = url; });
    const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("preview");
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("preview")), "image/jpeg", 0.8));
  } finally { URL.revokeObjectURL(url); }
}

// Brand mark, bottom-left: small see-through "kirayeal.az" (no box) with a soft shadow, so it is
// readable on light and dark photos without covering them.
export function drawBrandMark(context: CanvasRenderingContext2D, width: number, height: number) {
  const side = Math.min(width, height);
  const font = Math.max(12, Math.round(side * 0.032));
  const margin = Math.max(8, Math.round(side * 0.03));
  const family = brandFamily();
  context.save();
  context.font = `800 ${font}px ${family}`;
  context.textBaseline = "alphabetic"; context.textAlign = "left";
  const name = "kirayeal", nameWidth = context.measureText(name).width;
  const x = margin, y = height - margin;
  context.shadowColor = "rgba(0,0,0,0.45)"; context.shadowBlur = Math.round(font * 0.35); context.shadowOffsetY = Math.max(1, Math.round(font * 0.05));
  context.globalAlpha = 0.72;
  context.fillStyle = "#ffffff"; context.fillText(name, x, y);
  context.fillStyle = "#ff7a45"; context.fillText(".az", x + nameWidth, y);
  context.restore();
}

// The site's own font (the one the logo uses) when it is available in this page, else system fonts.
const fallbackFamily = `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
function brandFamily() {
  if (typeof document === "undefined") return fallbackFamily;
  const family = getComputedStyle(document.body).fontFamily;
  return family ? `${family}, ${fallbackFamily}` : fallbackFamily;
}
