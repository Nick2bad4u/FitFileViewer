import { afterEach, describe, expect, it } from "vitest";

import {
    readFitBrowserLibraryCache,
    resetFitBrowserLibraryCacheForTests,
    writeFitBrowserLibraryCache,
} from "../../../../../electron-app/utils/ui/browser/fileBrowserLibraryCache.js";

describe("fileBrowserLibraryCache", () => {
    afterEach(() => {
        resetFitBrowserLibraryCacheForTests();
    });

    it("stores cache payloads by browser root without leaking between roots", () => {
        expect.assertions(3);

        const firstPayload = {
            items: [
                {
                    fullPath: "C:/rides/first.fit",
                },
            ],
            scannedAt: 123,
        };
        const secondPayload = {
            items: [
                {
                    fullPath: "C:/rides/second.fit",
                },
            ],
            scannedAt: 456,
        };

        writeFitBrowserLibraryCache("C:/rides", firstPayload);
        writeFitBrowserLibraryCache("D:/activities", secondPayload);

        expect(readFitBrowserLibraryCache("C:/rides")).toStrictEqual(
            firstPayload
        );
        expect(readFitBrowserLibraryCache("D:/activities")).toStrictEqual(
            secondPayload
        );
        expect(readFitBrowserLibraryCache("E:/missing")).toBeNull();
    });

    it("reset clears cached payloads", () => {
        expect.assertions(1);

        writeFitBrowserLibraryCache("C:/rides", {
            items: [],
            scannedAt: 123,
        });

        resetFitBrowserLibraryCacheForTests();

        expect(readFitBrowserLibraryCache("C:/rides")).toBeNull();
    });
});
