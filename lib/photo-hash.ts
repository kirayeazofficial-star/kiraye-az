"use client";
// 64-bit difference hash of a photo: the picture is shrunk to 9×8 grey pixels and each bit says whether a pixel
// is brighter than its right neighbour. Resizing, re-compressing or a small logo barely change it.
export async function photoHash(file: Blob): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 9; canvas.height = 8;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return "";
    context.imageSmoothingQuality = "high";
    context.drawImage(bitmap, 0, 0, 9, 8);
    const data = context.getImageData(0, 0, 9, 8).data;
    const grey = (x: number, y: number) => { const i = (y * 9 + x) * 4; return data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114; };
    let bits = "";
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits += grey(x, y) > grey(x + 1, y) ? "1" : "0";
    return BigInt(`0b${bits}`).toString(16).padStart(16, "0");
  } finally { bitmap.close(); }
}
