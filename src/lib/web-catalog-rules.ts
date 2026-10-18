/** A full website MP4, not a locked stream, adaptive manifest, or preview. */
export function isFullWebStream(entry: { url?: unknown; format?: unknown; vipLocked?: unknown; size?: unknown; duration?: unknown }) {
  return typeof entry.url === "string" && entry.url.startsWith("https://") &&
    entry.vipLocked !== true && String(entry.format ?? "MP4").toUpperCase() === "MP4" &&
    Number(entry.size) >= 40 * 1024 * 1024 && Number(entry.duration) >= 300;
}

/** Ignore empty rotated duplicates, while retaining every populated website rail. */
export function mergeWebRows<T extends { id: string }>(rows: { title: string; items: T[] }[]) {
  const merged: { title: string; items: T[] }[] = [];
  for (const row of rows) {
    if (!row.items.length) continue;
    const existing = merged.find((r) => r.title.toLowerCase() === row.title.toLowerCase());
    if (!existing) { merged.push({ ...row, items: [...row.items] }); continue; }
    const ids = new Set(existing.items.map((i) => i.id));
    for (const item of row.items) if (!ids.has(item.id)) { existing.items.push(item); ids.add(item.id); }
  }
  return merged;
}