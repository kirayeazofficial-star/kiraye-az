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
    drawBrandMark(context, canvas.width, canvas.height);
    // Sharp enough to zoom in on, but always under the 5 MB upload limit.
    const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Şəkli hazırlamaq mümkün olmadı.")), "image/jpeg", quality));
    let blob = await encode(0.92);
    for (const quality of [0.86, 0.8, 0.72]) { if (blob.size <= 4.5 * 1024 * 1024) break; blob = await encode(quality); }
    return new File([blob], `branded-${file.name}.jpg`, { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}

// Brand mark, bottom-left: one rounded badge — orange "k" tile + "kirayeal.az" in bold — on a soft dark
// translucent backing, so it reads the same on light and dark photos.
export function drawBrandMark(context: CanvasRenderingContext2D, width: number, height: number) {
  const side = Math.min(width, height);
  const font = Math.max(14, Math.round(side * 0.046));
  const margin = Math.max(10, Math.round(side * 0.04));
  const family = `system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif`;
  const pad = Math.round(font * 0.28), tile = Math.round(font * 1.3), gap = Math.round(font * 0.36);
  context.save();
  context.font = `800 ${font}px ${family}`;
  const name = "kirayeal", nameWidth = context.measureText(name).width, textWidth = nameWidth + context.measureText(".az").width;
  const boxH = tile + pad * 2, boxW = Math.round(pad + tile + gap + textWidth + font * 0.6);
  const x = margin, y = height - margin - boxH, middle = y + boxH / 2;
  const round = (left: number, top: number, w: number, h: number, r: number) => { context.beginPath(); if (typeof context.roundRect === "function") context.roundRect(left, top, w, h, r); else context.rect(left, top, w, h); };
  context.fillStyle = "rgba(15,18,22,0.55)"; round(x, y, boxW, boxH, Math.round(boxH * 0.3)); context.fill();
  context.fillStyle = "#ff5a1f"; round(x + pad, y + pad, tile, tile, Math.round(tile * 0.24)); context.fill();
  context.textBaseline = "middle";
  context.fillStyle = "#fff"; context.textAlign = "center"; context.font = `800 ${Math.round(tile * 0.7)}px ${family}`;
  context.fillText("k", x + pad + tile / 2, middle + tile * 0.02);
  context.textAlign = "left"; context.font = `800 ${font}px ${family}`;
  const textX = x + pad + tile + gap;
  context.fillStyle = "#fff"; context.fillText(name, textX, middle);
  context.fillStyle = "#ff8a57"; context.fillText(".az", textX + nameWidth, middle);
  context.restore();
}
