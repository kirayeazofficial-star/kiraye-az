// Crops a picked photo to a centred square JPEG before upload, so avatars stay small and uniform.
export async function squareAvatar(file: File, size = 400): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("Şəkli oxumaq mümkün olmadı."));
      element.src = url;
    });
    const side = Math.min(image.naturalWidth, image.naturalHeight);
    if (!side) throw new Error("Şəkli oxumaq mümkün olmadı.");
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = Math.min(size, side);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Şəkli hazırlamaq mümkün olmadı.");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Şəkli hazırlamaq mümkün olmadı.")), "image/jpeg", 0.88));
  } finally {
    URL.revokeObjectURL(url);
  }
}
