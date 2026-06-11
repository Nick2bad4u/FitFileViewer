import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    clearRendererActiveFileState,
    getRendererCurrentFile,
    getRendererFileInfo,
    isRendererUnloadButtonVisible,
    normalizeRendererFileInfo,
    setRendererCurrentFile,
    setRendererFileInfo,
    setRendererUnloadButtonVisible,
} from "../../../../../electron-app/utils/state/domain/rendererActiveFileState.js";

describe("rendererActiveFileState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes active file UI state through typed helpers", () => {
        expect.assertions(4);

        setRendererFileInfo({
            displayName: "ride.fit",
            hasFile: true,
            title: "ride.fit - Fit File Viewer",
        });
        setRendererUnloadButtonVisible(true);

        expect(getRendererFileInfo()).toStrictEqual({
            displayName: "ride.fit",
            hasFile: true,
            title: "ride.fit - Fit File Viewer",
        });
        expect(isRendererUnloadButtonVisible()).toBe(true);

        clearRendererActiveFileState();

        expect(getRendererFileInfo()).toStrictEqual({
            displayName: "",
            hasFile: false,
            title: "",
        });
        expect(isRendererUnloadButtonVisible()).toBe(false);
    });

    it("reads and writes the legacy currentFile bridge through typed helpers", () => {
        expect.assertions(3);

        expect(getRendererCurrentFile()).toBeNull();

        setRendererCurrentFile("C:/rides/activity.fit");
        expect(getRendererCurrentFile()).toBe("C:/rides/activity.fit");

        setRendererCurrentFile(null);
        expect(getRendererCurrentFile()).toBeNull();
    });

    it("normalizes file info values", () => {
        expect.assertions(3);

        expect(normalizeRendererFileInfo(null)).toStrictEqual({
            displayName: "",
            hasFile: false,
            title: "",
        });
        expect(
            normalizeRendererFileInfo({
                displayName: "race.fit",
                hasFile: "yes",
                title: 123,
            })
        ).toStrictEqual({
            displayName: "race.fit",
            hasFile: false,
            title: "",
        });
        expect(
            normalizeRendererFileInfo({
                displayName: "race.fit",
                hasFile: true,
                title: "Race",
            })
        ).toStrictEqual({
            displayName: "race.fit",
            hasFile: true,
            title: "Race",
        });
    });
});
