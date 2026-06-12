import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    appendLoadedFitFile,
    clearOverlayLoadedFitFiles,
    getLoadedFitFiles,
    getOverlayLoadedFitFiles,
    keepOnlyLoadedFitFileAt,
    removeLoadedFitFileAt,
    setLoadedFitFiles,
} from "../../../../../electron-app/utils/state/domain/loadedFitFilesState.js";

describe("loadedFitFilesState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("stores loaded files in explicit state without mirroring a legacy global", () => {
        expect.assertions(4);

        const files = [
            {
                data: { recordMesgs: [] },
                filePath: "main.fit",
            },
        ];

        const returnedFiles = setLoadedFitFiles(files, "test");

        expect(stateManager.getState("fitFile.loadedFiles")).toStrictEqual(
            files
        );
        expect(Reflect.has(globalThis, "loadedFitFiles")).toBe(false);
        expect(returnedFiles).toStrictEqual(files);
        expect(returnedFiles).not.toBe(files);
    });

    it("reads only explicit loaded-file state when no files are stored", () => {
        expect.assertions(2);

        expect(getLoadedFitFiles()).toStrictEqual([]);
        expect(stateManager.getState("fitFile.loadedFiles")).toStrictEqual([]);
    });

    it("updates loaded files through append, remove, keep-only, and clear-overlay helpers", () => {
        expect.assertions(4);

        setLoadedFitFiles(
            [{ filePath: "main.fit" }, { filePath: "overlay-a.fit" }],
            "test"
        );

        appendLoadedFitFile({ filePath: "overlay-b.fit" }, "test");
        expect(getLoadedFitFiles().map((file) => file.filePath)).toStrictEqual([
            "main.fit",
            "overlay-a.fit",
            "overlay-b.fit",
        ]);

        removeLoadedFitFileAt(1, "test");
        expect(getLoadedFitFiles().map((file) => file.filePath)).toStrictEqual([
            "main.fit",
            "overlay-b.fit",
        ]);

        keepOnlyLoadedFitFileAt(1, "test");
        expect(getLoadedFitFiles().map((file) => file.filePath)).toStrictEqual([
            "overlay-b.fit",
        ]);

        appendLoadedFitFile({ filePath: "overlay-c.fit" }, "test");
        clearOverlayLoadedFitFiles("test");
        expect(getLoadedFitFiles().map((file) => file.filePath)).toStrictEqual([
            "overlay-b.fit",
        ]);
    });

    it("returns overlay files with their loaded-file indices", () => {
        expect.assertions(1);

        setLoadedFitFiles(
            [
                { filePath: "main.fit" },
                { filePath: "overlay-a.fit" },
                { filePath: "overlay-b.fit" },
            ],
            "test"
        );

        expect(
            getOverlayLoadedFitFiles().map(
                ({ file, fileIndex, overlayIndex }) => ({
                    filePath: file.filePath,
                    fileIndex,
                    overlayIndex,
                })
            )
        ).toStrictEqual([
            {
                fileIndex: 1,
                filePath: "overlay-a.fit",
                overlayIndex: 0,
            },
            {
                fileIndex: 2,
                filePath: "overlay-b.fit",
                overlayIndex: 1,
            },
        ]);
    });
});
