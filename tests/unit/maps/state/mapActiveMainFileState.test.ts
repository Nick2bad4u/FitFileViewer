import { beforeEach, describe, expect, it } from "vitest";

import {
    getActiveMainMapFileIndex,
    resetActiveMainMapFileIndexForTests,
    setActiveMainMapFileIndex,
} from "../../../../electron-app/utils/maps/state/mapActiveMainFileState.js";

describe("mapActiveMainFileState", () => {
    beforeEach(() => {
        resetActiveMainMapFileIndexForTests();
    });

    it("stores and resets the active main file index", () => {
        expect.assertions(2);

        setActiveMainMapFileIndex(2);

        expect(getActiveMainMapFileIndex()).toBe(2);

        resetActiveMainMapFileIndexForTests();

        expect(getActiveMainMapFileIndex()).toBeNull();
    });

    it("normalizes non-finite indexes to null", () => {
        expect.assertions(1);

        setActiveMainMapFileIndex(Number.NaN);

        expect(getActiveMainMapFileIndex()).toBeNull();
    });
});
