import { describe, expect, it } from "vitest";

import { copyTableAsCSV } from "../../../../../electron-app/utils/files/export/copyTableAsCSV.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type ClipboardElectronAPI = {
    writeClipboardText?: (text: string) => boolean | Promise<boolean>;
};

function createClipboardApiScope(
    api: ClipboardElectronAPI
): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

describe(copyTableAsCSV, () => {
    it("serializes row arrays to CSV through the Electron clipboard bridge", async () => {
        expect.assertions(1);

        let clipboardText = "";
        const electronApiScope = createClipboardApiScope({
            writeClipboardText: async (text) => {
                clipboardText = text;
                return true;
            },
        });

        await copyTableAsCSV(
            [
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
            ],
            { electronApiScope }
        );

        expect(clipboardText).toBe(
            [
                "extra,name,nested",
                ',\"A, B\",\"{\"\"x\"\":1}\"',
                "z,C,",
            ].join("\r\n")
        );
    });

    it("serializes rows-table objects without invoking compatibility methods", async () => {
        expect.assertions(1);

        let clipboardText = "";
        const electronApiScope = createClipboardApiScope({
            writeClipboardText: (text) => {
                clipboardText = text;
                return true;
            },
        });

        await copyTableAsCSV(
            {
                objects: () => {
                    throw new Error("objects() should not be called");
                },
                rows: [
                    {
                        cadence: 90,
                        speed: 10,
                    },
                ],
            },
            { electronApiScope }
        );

        expect(clipboardText).toBe("cadence,speed\r\n90,10");
    });

    it("rejects unsupported table inputs", async () => {
        expect.assertions(1);

        await expect(copyTableAsCSV(null)).rejects.toThrow(
            "Invalid table object: expected row array or rows property"
        );
    });
});
