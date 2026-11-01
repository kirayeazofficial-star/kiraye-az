// "Açıqdır · 18:00-dək" / "Bağlıdır · 09:00-da açılır" from a store's daily hours, in Baku time (UTC+4).
export function storeOpenState(from?: string | null, to?: string | null, now = new Date()) {
  if (!from || !to) return null;
  const minutes = (value: string) => { const [h, m] = value.split(":").map(Number); return h * 60 + m; };
  const baku = (now.getUTCHours() * 60 + now.getUTCMinutes() + 240) % 1440, start = minutes(from), end = minutes(to);
  const open = start === end ? true : start < end ? baku >= start && baku < end : baku >= start || baku < end;
  return open ? { open: true, text: start === end ? "Açıqdır · 24 saat" : `Açıqdır · ${to}-dək` } : { open: false, text: `Bağlıdır · ${from}-da açılır` };
}
