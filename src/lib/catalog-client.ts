import { searchTitles } from "./catalog.functions";
import type { CatalogItem } from "./moviebox";

/**
 * Search the MovieBox web catalog from the visitor's browser first (hosted
 * servers like Cloudflare get refused), falling back to the server function.
 */
export async function searchAny(q: string, page = 1): Promise<CatalogItem[]> {
  if (typeof window !== "undefined") {
    try {
      const { searchCatalog } = await import("./moviebox");
      const items = await searchCatalog(q, page);
      if (items.length) return items;
    } catch {
      /* fall back to the server */
    }
  }
  return searchTitles({ data: { q, page } });
}
