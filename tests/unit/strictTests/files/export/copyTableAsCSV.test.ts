import { beforeEach, describe, expect, it } from "vitest";

// Minimal Arquero-like API used by the module
(window as any).aq = {
    from: (rows: any[]) => ({
        toCSV: ({ header }: { header: boolean }) => {
            const keys = Object.keys(rows[0] ?? {});
            const serialize = (v: any) =>
                typeof v === "string" ? v : String(v);
            const lines = rows.map((r) =>
                keys.map((k) => serialize(r[k] ?? "")).join(",")
            );
            return (
                (header
                    ? `${keys.join(",")}` + (lines.length ? "\n" : "")
                    : "") + lines.join("\n")
            );
        },
    }),
};

describe("copyTableAsCSV", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    it("copies using modern Clipboard API and stringifies nested objects", async () => {
        expect.assertions(2);

        const nav = globalThis.navigator as any;
        let copiedText = "";
        nav.clipboard = {
            writeText: async (text: string) => {
                copiedText = text;
            },
        };
        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");

        const shared = { z: 3 };
        const table = {
            objects: () => [
                { a: 1, b: { c: 2 }, d: shared },
                { a: 4, b: { e: 5 }, d: shared },
            ],
        };
        await copyTableAsCSV(table as any);
        expect(copiedText).toBe(
            'a,b,d\r\n1,"{""c"":2}","{""z"":3}"\r\n4,"{""e"":5}","{""z"":3}"'
        );
        expect(document.querySelector("textarea")).toBeNull();
    });

    it("falls back when Clipboard API not available", async () => {
        expect.assertions(3);

        // Remove clipboard to force fallback
        const nav = globalThis.navigator as any;
        delete nav.clipboard;
        let copiedCommand = "";
        let copiedText = "";
        (document as any).execCommand = (command: string) => {
            copiedCommand = command;
            copiedText =
                document.querySelector<HTMLTextAreaElement>("textarea")
                    ?.value ?? "";
            return true;
        };
        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");
        const table = { objects: () => [{ x: 1 }] };
        await copyTableAsCSV(table as any);
        expect(copiedCommand).toBe("copy");
        expect(copiedText).toBe("x\n1");
        expect(document.querySelector("textarea")).toBeNull();
    });

    it("throws on invalid table input", async () => {
        expect.assertions(1);

        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");
        await expect(copyTableAsCSV(null as any)).rejects.toThrow(
            "Invalid table object: missing objects method"
        );
    });
});
