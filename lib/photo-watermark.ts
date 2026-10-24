export async function watermarkPhoto(file: File): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Şəkli oxumaq mümkün olmadı.")); image.src = url; });
    if (image.naturalWidth * image.naturalHeight > 40000000) throw new Error("Şəklin ölçüsü çox böyükdür. Daha kiçik şəkil seç.");
    const scale = Math.min(1, 2048 / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Şəkli hazırlamaq mümkün olmadı.");
    context.fillStyle = "#fff"; context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const font = Math.max(10, Math.round(canvas.width * 0.035)), padding = Math.max(4, Math.round(canvas.width * 0.02));
    context.font = `600 ${font}px Arial, sans-serif`;
    const width = context.measureText("kirayeal.az").width;
    context.fillStyle = "rgba(255,255,255,0.20)";
    context.fillRect(padding, canvas.height - font - padding * 3, width + padding * 2, font + padding * 2);
    context.fillStyle = "rgba(255,255,255,0.78)";
    context.shadowColor = "rgba(0,0,0,0.45)"; context.shadowBlur = 2;
    context.fillText("kirayeal.az", padding * 2, canvas.height - padding * 2);
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Şəkli hazırlamaq mümkün olmadı.")), "image/jpeg", 0.9));
    return new File([blob], `branded-${file.name}.jpg`, { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(url); }
}
