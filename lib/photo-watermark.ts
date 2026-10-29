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
    // Brand mark: a small dark pill with "kirayeal" in white and ".az" in orange, bottom-left.
    const side = Math.min(canvas.width, canvas.height);
    const font = Math.max(12, Math.round(side * 0.042));
    const margin = Math.max(6, Math.round(side * 0.03));
    context.font = `700 ${font}px "Inter", "Segoe UI", Arial, sans-serif`;
    context.textBaseline = "middle"; context.textAlign = "left";
    const name = "kirayeal", domain = ".az";
    const nameWidth = context.measureText(name).width, width = nameWidth + context.measureText(domain).width;
    const padX = Math.round(font * 0.55), height = Math.round(font * 1.6);
    const x = margin, y = canvas.height - margin - height;
    context.fillStyle = "rgba(0,0,0,0.38)";
    context.beginPath();
    if (typeof context.roundRect === "function") context.roundRect(x, y, width + padX * 2, height, height / 2); else context.rect(x, y, width + padX * 2, height);
    context.fill();
    context.fillStyle = "rgba(255,255,255,0.95)"; context.fillText(name, x + padX, y + height / 2);
    context.fillStyle = "#ff7a45"; context.fillText(domain, x + padX + nameWidth, y + height / 2);
    // Sharp enough to zoom in on, but always under the 5 MB upload limit.
    const encode = (quality: number) => new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Şəkli hazırlamaq mümkün olmadı.")), "image/jpeg", quality));
    let blob = await encode(0.92);
    for (const quality of [0.86, 0.8, 0.72]) { if (blob.size <= 4.5 * 1024 * 1024) break; blob = await encode(quality); }
    return new File([blob], `branded-${file.name}.jpg`, { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
