import { beforeEach, describe, expect, it } from "vitest";

describe("copyTableAsCSV", () => {
    beforeEach(() => {
        document.body.replaceChildren();
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
        const table = [
            { a: 1, b: { c: 2 }, d: shared },
            { a: 4, b: { e: 5 }, d: shared },
        ];
        await copyTableAsCSV(table);
        expect(copiedText).toBe(
            'a,b,d\r\n1,"{""c"":2}","{""z"":3}"\r\n4,"{""e"":5}","{""z"":3}"'
        );
        expect(document.querySelector("textarea")).toBeNull();
    });

    it("copies rows-table objects without invoking unsafe table methods", async () => {
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
            objects: () => {
                throw new Error("objects() should not be called");
            },
            rows: [
                { a: 1, b: { c: 2 }, d: shared },
                { a: 4, b: { e: 5 }, d: shared },
            ],
        };
        await copyTableAsCSV(table);
        expect(copiedText).toBe(
            'a,b,d\r\n1,"{""c"":2}","{""z"":3}"\r\n4,"{""e"":5}","{""z"":3}"'
        );
        expect(document.querySelector("textarea")).toBeNull();
    });

    it("falls back when Clipboard API not available", async () => {
        expect.assertions(4);

        // Remove clipboard to force fallback
        const nav = globalThis.navigator as any;
        delete nav.clipboard;
        let copiedCommand = "";
        let copiedText = "";
        (document as any).execCommand = (command: string) => {
            copiedCommand = command;
            const textarea =
                document.querySelector<HTMLTextAreaElement>("textarea");
            expect(textarea).toBeInstanceOf(HTMLTextAreaElement);
            if (!(textarea instanceof HTMLTextAreaElement)) {
                throw new TypeError("Expected fallback textarea");
            }
            copiedText = textarea.value;
            return true;
        };
        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");
        const table = [{ x: 1 }];
        await copyTableAsCSV(table);
        expect(copiedCommand).toBe("copy");
        expect(copiedText).toBe("x\n1");
        expect(document.querySelector("textarea")).toBeNull();
    });

    it("throws on invalid table input", async () => {
        expect.assertions(1);

        const { copyTableAsCSV } =
            await import("../../../../../electron-app/utils/files/export/copyTableAsCSV.js");
        await expect(copyTableAsCSV(null as any)).rejects.toThrow(
            "Invalid table object: expected row array or rows property"
        );
    });
});
