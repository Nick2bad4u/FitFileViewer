import { describe, expect, it } from "vitest";

import { copyTableAsCSV } from "../../../../../electron-app/utils/files/export/copyTableAsCSV.js";

type ClipboardElectronAPI = {
    writeClipboardText?: (text: string) => boolean | Promise<boolean>;
};

type CopyCsvTestGlobal = typeof globalThis & {
    electronAPI?: ClipboardElectronAPI;
};

const appGlobal = globalThis as CopyCsvTestGlobal;

function cleanupGlobals() {
    delete appGlobal.electronAPI;
}

describe(copyTableAsCSV, () => {
    it("serializes row arrays to CSV through the Electron clipboard bridge", async () => {
        expect.assertions(1);

        let clipboardText = "";

        try {
            appGlobal.electronAPI = {
                writeClipboardText: async (text) => {
                    clipboardText = text;
                    return true;
                },
            };

            await copyTableAsCSV([
                {
                    extra: undefined,
                    name: "A, B",
                    nested: { x: 1 },
                },
                {
                    extra: "z",
                    name: "C",
                    nested: null,
                },
            ]);

            expect(clipboardText).toBe(
                [
                    "extra,name,nested",
                    ',\"A, B\",\"{\"\"x\"\":1}\"',
                    "z,C,",
                ].join("\r\n")
            );
        } finally {
            cleanupGlobals();
        }
    });

    it("supports legacy objects table inputs without unsafe casts", async () => {
        expect.assertions(1);

        let clipboardText = "";

        try {
            appGlobal.electronAPI = {
                writeClipboardText: (text) => {
                    clipboardText = text;
                    return true;
                },
            };

            await copyTableAsCSV({
                objects: () => [
                    {
                        cadence: 90,
                        speed: 10,
                    },
                ],
            });

            expect(clipboardText).toBe("cadence,speed\r\n90,10");
        } finally {
            cleanupGlobals();
        }
    });

    it("rejects unsupported table inputs", async () => {
        expect.assertions(1);

        await expect(copyTableAsCSV(null)).rejects.toThrow(
            "Invalid table object: missing objects method"
        );
    });
});
