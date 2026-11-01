import { access } from "node:fs/promises";
import path from "node:path";

// Link-preview image for a listing photo: the small "share-" copy when it exists (photos uploaded
// since it was introduced), otherwise the photo itself.
export async function shareImagePath(src: string): Promise<string> {
  const match = /^\/api\/media\/([0-9a-f-]{36})\/([0-9a-f-]{36}\.jpg)$/i.exec(src);
  const root = process.env.KIRAYE_STORAGE_ROOT || "";
  if (!match || !root) return src;
  try { await access(path.join(root, match[1], `share-${match[2]}`)); return `/api/media/${match[1]}/share-${match[2]}`; }
  catch { return src; }
}
