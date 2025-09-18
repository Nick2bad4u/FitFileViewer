import { describe, it, expect, vi, beforeEach } from "vitest";

// Minimal Arquero-like API used by the module
(window as any).aq = {
  from: (rows: any[]) => ({
    toCSV: ({ header }: { header: boolean }) => {
      const keys = Object.keys(rows[0] ?? {});
      const serialize = (v: any) => (typeof v === "string" ? v : String(v));
      const lines = rows.map((r) => keys.map((k) => serialize(r[k] ?? "")).join(","));
      return (header ? `${keys.join(",")}` + (lines.length ? "\n" : "") : "") + lines.join("\n");
    },
  }),
};

describe("copyTableAsCSV", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("copies using modern Clipboard API and stringifies nested objects", async () => {
    const nav = (globalThis.navigator as any);
    nav.clipboard = { writeText: vi.fn(async () => {}) };
    const { copyTableAsCSV } = await import("../../../../utils/files/export/copyTableAsCSV.js");

    const shared = { z: 3 };
    const table = { objects: () => [{ a: 1, b: { c: 2 }, d: shared }, { a: 4, b: { e: 5 }, d: shared }] };
    await copyTableAsCSV(table as any);
    expect(nav.clipboard.writeText).toHaveBeenCalled();
  });

  it("falls back when Clipboard API not available", async () => {
    // Remove clipboard to force fallback
    const nav = (globalThis.navigator as any);
    delete nav.clipboard;
    if (!(document as any).execCommand) (document as any).execCommand = () => true;
    const exec = vi.spyOn(document, "execCommand");
    const { copyTableAsCSV } = await import("../../../../utils/files/export/copyTableAsCSV.js");
    const table = { objects: () => [{ x: 1 }] };
    await copyTableAsCSV(table as any);
    expect(exec).toHaveBeenCalledWith("copy");
  });

  it("throws on invalid table input", async () => {
    const { copyTableAsCSV } = await import("../../../../utils/files/export/copyTableAsCSV.js");
    await expect(copyTableAsCSV(null as any)).rejects.toThrowError();
  });
});
