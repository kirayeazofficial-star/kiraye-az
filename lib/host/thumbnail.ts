import "server-only";
import jpeg from "jpeg-js";

// Small JPEG copy (longest side ≤ 560 px) for lists and cards, made on the server in plain JavaScript
// (no native image library is needed on the hosting). Box-averaging keeps the small copy sharp and clean.
export function makeThumbnail(source: Buffer, side = 560, quality = 78): Buffer {
  const image = jpeg.decode(source, { useTArray: true, maxMemoryUsageInMB: 256, formatAsRGBA: true });
  const { width, height, data } = image;
  const scale = Math.min(1, side / Math.max(width, height));
  if (scale >= 1) return source;
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(w * h * 4);
  const stepX = width / w, stepY = height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * stepY), y1 = Math.min(height, Math.max(y0 + 1, Math.floor((y + 1) * stepY)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * stepX), x1 = Math.min(width, Math.max(x0 + 1, Math.floor((x + 1) * stepX)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        let i = (sy * width + x0) * 4;
        for (let sx = x0; sx < x1; sx++, i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
    }
  }
  return Buffer.from(jpeg.encode({ data: out, width: w, height: h }, quality).data);
}

// One thumbnail at a time (the hosting has little CPU), and the same photo is never made twice at once.
let queue: Promise<unknown> = Promise.resolve();
const running = new Map<string, Promise<Buffer | null>>();
export function queuedThumbnail(key: string, make: () => Promise<Buffer | null>) {
  const existing = running.get(key);
  if (existing) return existing;
  const job = queue.then(make, make).catch(() => null).finally(() => running.delete(key));
  queue = job;
  running.set(key, job);
  return job;
}
