import { describe, it, expect, vi, beforeEach } from "vitest";

async function importGetOverlayFileName() {
    return import("../../../../../electron-app/utils/files/import/getOverlayFileName.js");
}

describe("getOverlayFileName", () => {
    beforeEach(() => {
        vi.resetModules();
    });

    it("throws on invalid index types", async () => {
        expect.assertions(3);

        const { getOverlayFileName } = await importGetOverlayFileName();
        expect(() => getOverlayFileName(-1 as any)).toThrow(
            "Index must be a non-negative integer"
        );
        expect(() => getOverlayFileName(1.2 as any)).toThrow(TypeError);
        expect(() => getOverlayFileName(NaN as any)).toThrow(TypeError);
    });

    it("returns empty string when item missing or invalid filePath", async () => {
        expect.assertions(3);

        vi.doMock(
            import("../../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
            () => ({
                getLoadedFitFiles: vi.fn<() => unknown>(() => [
                    {},
                    { filePath: 123 },
                    { filePath: "   " },
                ]),
            })
        );
        const { getOverlayFileName } = await importGetOverlayFileName();
        expect(getOverlayFileName(0)).toBe("");
        expect(getOverlayFileName(1)).toBe("");
        expect(getOverlayFileName(2)).toBe("");
    });

    it("ignores malformed loaded file entries before reading filePath", async () => {
        expect.assertions(4);

        vi.doMock(
            import("../../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
            () => ({
                getLoadedFitFiles: vi.fn<() => unknown>(() => [
                    null,
                    "C:/data/string.fit",
                    ["C:/data/array.fit"],
                    { filePath: "C:/data/ride.fit" },
                ]),
            })
        );
        const { getOverlayFileName } = await importGetOverlayFileName();
        expect(getOverlayFileName(0)).toBe("");
        expect(getOverlayFileName(1)).toBe("");
        expect(getOverlayFileName(2)).toBe("");
        expect(getOverlayFileName(3)).toBe("C:/data/ride.fit");
    });

    it("returns filePath when present", async () => {
        expect.assertions(1);

        vi.doMock(
            import("../../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
            () => ({
                getLoadedFitFiles: vi.fn<() => unknown>(() => [
                    { filePath: "C:/data/ride.fit" },
                ]),
            })
        );
        const { getOverlayFileName } = await importGetOverlayFileName();
        expect(getOverlayFileName(0)).toBe("C:/data/ride.fit");
    });

    it("handles getState throwing and returns empty string", async () => {
        expect.assertions(1);

        vi.doMock(
            import("../../../../../electron-app/utils/state/domain/loadedFitFilesState.js"),
            () => ({
                getLoadedFitFiles: vi.fn<() => unknown>(() => {
                    throw new Error("boom");
                }),
            })
        );
        const { getOverlayFileName } = await importGetOverlayFileName();
        expect(getOverlayFileName(0)).toBe("");
    });
});
