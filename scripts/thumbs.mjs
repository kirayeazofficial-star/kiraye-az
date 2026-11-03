// Small copies (thumb-<name>.jpg, longest side 560 px) for photos uploaded before small copies existed.
// The 5-minute cron job (backup-to-drive.mjs) makes up to 40 per run, so lists on phones never load the
// 1–4 MB originals. Same method as lib/host/thumbnail.ts (plain JavaScript, no native image library).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

function makeThumbnail(jpeg, source, side = 560, quality = 78) {
  const { width, height, data } = jpeg.decode(source, { useTArray: true, maxMemoryUsageInMB: 256, formatAsRGBA: true });
  const scale = Math.min(1, side / Math.max(width, height));
  if (scale >= 1) return source;
  const w = Math.max(1, Math.round(width * scale)), h = Math.max(1, Math.round(height * scale));
  const out = new Uint8Array(w * h * 4), stepX = width / w, stepY = height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * stepY), y1 = Math.min(height, Math.max(y0 + 1, Math.floor((y + 1) * stepY)));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * stepX), x1 = Math.min(width, Math.max(x0 + 1, Math.floor((x + 1) * stepX)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) { let i = (sy * width + x0) * 4; for (let sx = x0; sx < x1; sx++, i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; } }
      const o = (y * w + x) * 4; out[o] = r / n; out[o + 1] = g / n; out[o + 2] = b / n; out[o + 3] = 255;
    }
  }
  return Buffer.from(jpeg.encode({ data: out, width: w, height: h }, quality).data);
}

export async function runThumbs(requireFromApp, limit = 40, timeLimitMs = 60000) {
  const root = process.env.KIRAYE_STORAGE_ROOT;
  if (!root) return;
  const jpeg = requireFromApp("jpeg-js");
  const started = Date.now();
  let made = 0;
  for (const owner of await readdir(root).catch(() => [])) {
    const dir = join(root, owner);
    const files = await readdir(dir).catch(() => []);
    const present = new Set(files);
    for (const file of files) {
      if (!/^(?:branded-v3-)?[0-9a-f-]{36}\.jpg$/i.test(file) || present.has(`thumb-${file}`)) continue;
      if (made >= limit || Date.now() - started > timeLimitMs) return made;
      try {
        const source = (present.has(`share-${file}`) ? await readFile(join(dir, `share-${file}`)) : null) || await readFile(join(dir, file));
        await writeFile(join(dir, `thumb-${file}`), makeThumbnail(jpeg, source), { mode: 0o600, flag: "wx" });
        made++;
      } catch (error) { console.error("thumb failed:", file, String(error?.message || error).slice(0, 120)); }
    }
  }
  return made;
}
