import { afterEach, describe, expect, it, vi } from "vitest";

import { copyTableAsCSV } from "../../../../../electron-app/utils/files/export/copyTableAsCSV.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type ClipboardElectronAPI = {
    writeClipboardText?: (text: string) => boolean | Promise<boolean>;
};

function createClipboardApiScope(api: unknown): RendererElectronApiScope {
    return {
        getElectronAPI: () => api,
    };
}

const originalClipboardDescriptor = Object.getOwnPropertyDescriptor(
    navigator,
    "clipboard"
);

function installClipboard(
    clipboard: Readonly<{ writeText: (text: string) => Promise<void> | void }>
): void {
    Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: clipboard,
    });
}

function restoreClipboard(): void {
    if (originalClipboardDescriptor) {
        Object.defineProperty(
            navigator,
            "clipboard",
            originalClipboardDescriptor
        );
        return;
    }

    Reflect.deleteProperty(navigator, "clipboard");
}

describe(copyTableAsCSV, () => {
    afterEach(() => {
        restoreClipboard();
        vi.restoreAllMocks();
    });

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

    it("falls back to browser clipboard when scoped Electron API is array-shaped", async () => {
        expect.assertions(4);

        const writeText = vi.fn<(text: string) => Promise<void>>();
        installClipboard({ writeText });

        const writeClipboardText = vi.fn<(text: string) => boolean>(() => true);
        const arrayShapedApi = [] as unknown[];
        Object.assign(arrayShapedApi, { writeClipboardText });
        const electronApiScope = createClipboardApiScope(arrayShapedApi);

        await expect(
            copyTableAsCSV([{ name: "A" }], { electronApiScope })
        ).resolves.toBeUndefined();

        expect(writeClipboardText).not.toHaveBeenCalled();
        expect(writeText).toHaveBeenCalledWith("name\r\nA");
        expect(writeText).toHaveBeenCalledOnce();
    });

    it("rejects unsupported table inputs", async () => {
        expect.assertions(1);

        await expect(copyTableAsCSV(null)).rejects.toThrow(
            "Invalid table object: expected row array or rows property"
        );
    });
});
