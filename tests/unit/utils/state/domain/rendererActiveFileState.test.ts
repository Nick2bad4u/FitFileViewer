import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    clearRendererActiveFileState,
    getRendererCurrentFile,
    getRendererFileInfo,
    isRendererUnloadButtonVisible,
    normalizeRendererCurrentFile,
    normalizeRendererFileInfo,
    normalizeRendererUnloadButtonVisible,
    setRendererCurrentFile,
    setRendererFileInfo,
    setRendererUnloadButtonVisible,
    subscribeToRendererFileInfo,
    subscribeToRendererUnloadButtonVisible,
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

    it("reads current file state from the fit-file domain path", () => {
        expect.assertions(4);

        expect(getRendererCurrentFile()).toBeNull();

        setRendererCurrentFile("C:/rides/activity.fit");
        expect(getRendererCurrentFile()).toBe("C:/rides/activity.fit");
        expect(stateManager.getState("fitFile.currentFile")).toBe(
            "C:/rides/activity.fit"
        );

        setRendererCurrentFile("");
        expect(stateManager.getState("fitFile.currentFile")).toBeNull();
    });

    it("does not read or overwrite stale legacy currentFile state", () => {
        expect.assertions(3);

        stateManager.setState("currentFile", "C:/rides/stale.fit", {
            source: "test",
        });

        expect(getRendererCurrentFile()).toBeNull();

        setRendererCurrentFile(null);
        expect(getRendererCurrentFile()).toBeNull();
        expect(stateManager.getState("currentFile")).toBe("C:/rides/stale.fit");
    });

    it("normalizes active file values", () => {
        expect.assertions(9);

        expect(normalizeRendererCurrentFile("C:/rides/race.fit")).toBe(
            "C:/rides/race.fit"
        );
        expect(normalizeRendererCurrentFile("")).toBeNull();
        expect(normalizeRendererCurrentFile(123)).toBeNull();
        expect(normalizeRendererUnloadButtonVisible(true)).toBe(true);
        expect(normalizeRendererUnloadButtonVisible("true")).toBe(false);

        expect(normalizeRendererFileInfo(null)).toStrictEqual({
            displayName: "",
            hasFile: false,
            title: "",
        });
        expect(normalizeRendererFileInfo(["ride.fit"])).toStrictEqual({
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

    it("subscribes with normalized active file values", () => {
        expect.assertions(2);

        const fileInfoValues: unknown[] = [],
            subscriptionCleanups: Array<() => void> = [],
            unloadValues: boolean[] = [];

        subscriptionCleanups.push(
            subscribeToRendererFileInfo((fileInfo) =>
                fileInfoValues.push(fileInfo)
            ),
            subscribeToRendererUnloadButtonVisible((visible) =>
                unloadValues.push(visible)
            )
        );

        stateManager.setState(
            "ui.fileInfo",
            {
                displayName: "race.fit",
                hasFile: "yes",
                title: 123,
            },
            { source: "test" }
        );
        stateManager.setState("ui.unloadButtonVisible", "true", {
            source: "test",
        });
        setRendererUnloadButtonVisible(true, { source: "test" });
        stateManager.setState("ui.unloadButtonVisible", "true", {
            source: "test",
        });

        expect(fileInfoValues).toStrictEqual([
            {
                displayName: "race.fit",
                hasFile: false,
                title: "",
            },
        ]);
        expect(unloadValues).toStrictEqual([true, false]);

        for (const cleanup of subscriptionCleanups) {
            cleanup();
        }
    });

    it("stores normalized active file values through direct state writes", () => {
        expect.assertions(4);

        stateManager.setState(
            "ui.fileInfo",
            {
                displayName: "race.fit",
                hasFile: "yes",
                title: 123,
            },
            { source: "test" }
        );
        expect(stateManager.getState("ui.fileInfo")).toStrictEqual({
            displayName: "race.fit",
            hasFile: false,
            title: "",
        });

        stateManager.setState("ui.unloadButtonVisible", "true", {
            source: "test",
        });
        expect(stateManager.getState("ui.unloadButtonVisible")).toBe(false);

        stateManager.setState("fitFile.currentFile", "", { source: "test" });
        expect(stateManager.getState("fitFile.currentFile")).toBeNull();

        stateManager.setState("fitFile.currentFile", "C:/rides/current.fit", {
            source: "test",
        });
        expect(stateManager.getState("fitFile.currentFile")).toBe(
            "C:/rides/current.fit"
        );
    });
});
