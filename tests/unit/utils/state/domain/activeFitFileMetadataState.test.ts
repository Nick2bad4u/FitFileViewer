import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import { getActiveFitFileMetadata } from "../../../../../electron-app/utils/state/domain/activeFitFileMetadataState.js";

describe("activeFitFileMetadataState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("prefers the explicit current FIT file path for storage identity", () => {
        expect.assertions(1);

        stateManager.setState("fitFile.currentFile", "C:/rides/current.fit", {
            source: "test",
        });
        stateManager.setState(
            "fitFile.rawData",
            { cachedFilePath: "C:/rides/cached.fit" },
            { source: "test" }
        );
        stateManager.setState(
            "fitFile.loadedFiles",
            [{ filePath: "C:/rides/loaded.fit" }],
            { source: "test" }
        );

        expect(
            getActiveFitFileMetadata({
                fallbackName: "fallback.fit",
                sourceData: { cachedFilePath: "C:/rides/source.fit" },
            })
        ).toStrictEqual({
            cachedFilePath: "C:/rides/cached.fit",
            currentFilePath: "C:/rides/current.fit",
            fallbackName: "fallback.fit",
            loadedFilePath: "C:/rides/loaded.fit",
            storageIdentity: "C:/rides/current.fit",
        });
    });

    it("falls back through cached, loaded, and explicit fallback file names", () => {
        expect.assertions(4);

        stateManager.setState(
            "fitFile.rawData",
            { cachedFilePath: "C:/rides/global.fit" },
            { source: "test" }
        );
        expect(getActiveFitFileMetadata().storageIdentity).toBe(
            "C:/rides/global.fit"
        );

        stateManager.setState("fitFile.rawData", null, { source: "test" });
        expect(
            getActiveFitFileMetadata({
                sourceData: { cachedFilePath: "C:/rides/source.fit" },
            }).storageIdentity
        ).toBe("C:/rides/source.fit");

        stateManager.setState(
            "fitFile.loadedFiles",
            [{ filePath: "C:/rides/loaded.fit" }],
            { source: "test" }
        );
        expect(getActiveFitFileMetadata().storageIdentity).toBe(
            "C:/rides/loaded.fit"
        );

        stateManager.setState("fitFile.loadedFiles", [], { source: "test" });
        expect(
            getActiveFitFileMetadata({ fallbackName: "window-name.fit" })
                .storageIdentity
        ).toBe("window-name.fit");
    });

    it("returns null metadata when no file identity is available", () => {
        expect.assertions(1);

        expect(getActiveFitFileMetadata()).toStrictEqual({
            cachedFilePath: null,
            currentFilePath: null,
            fallbackName: null,
            loadedFilePath: null,
            storageIdentity: null,
        });
    });
});
