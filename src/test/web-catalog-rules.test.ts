import { describe, expect, it } from "vitest";
import { isFullWebStream, mergeWebRows } from "@/lib/web-catalog-rules";

describe("Website-only catalog", () => {
  it("retains Nollywood Movie when another rotated Nollywood Movie block is empty", () => {
    const rows = mergeWebRows([
      { title: "Nollywood Movie", items: [{ id: "5358743509530987296" }] },
      { title: "Nollywood Movie", items: [] },
      { title: "Popular Movie", items: [{ id: "movie" }] },
    ]);
    expect(rows).toEqual([
      { title: "Nollywood Movie", items: [{ id: "5358743509530987296" }] },
      { title: "Popular Movie", items: [{ id: "movie" }] },
    ]);
  });
  it("accepts the full website MP4 but rejects locked streams and adaptive manifests", () => {
    const stream = { url: "https://media.example/movie.mp4", format: "MP4", size: 411258808, duration: 6653 };
    expect(isFullWebStream(stream)).toBe(true);
    expect(isFullWebStream({ ...stream, vipLocked: true })).toBe(false);
    expect(isFullWebStream({ ...stream, format: "DASH" })).toBe(false);
    expect(isFullWebStream({ ...stream, size: 5000000, duration: 30 })).toBe(false);
    expect(isFullWebStream({ ...stream, duration: undefined })).toBe(false);
  });
});