// Real and sample listings share one page budget. Real listings keep priority.
export function catalogPreview<T>(items: T[], samples: T[], pageSize: number): T[] {
  return [...items.slice(0, pageSize), ...samples.slice(0, Math.max(0, pageSize - items.length))];
}
