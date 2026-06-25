import { beforeEach, describe, expect, it } from "vitest";

import {
    getMutableRootState,
    getRootState,
    resetRootState,
} from "../../../../../electron-app/utils/state/core/stateManagerStore.js";

describe("stateManagerStore", () => {
    beforeEach(() => {
        resetRootState();
    });

    it("owns a stable mutable root state container", () => {
        expect.assertions(8);

        const rootState = getRootState();
        const mutableRootState = getMutableRootState();

        mutableRootState.custom = { value: 1 };
        mutableRootState.currentFile = "C:/legacy-mirror.fit";

        expect(mutableRootState).toBe(rootState);
        expect(getRootState()).toBe(rootState);
        expect(getMutableRootState().custom).toStrictEqual({ value: 1 });
        expect(getMutableRootState().currentFile).toBe("C:/legacy-mirror.fit");

        resetRootState();

        expect(getRootState()).toBe(rootState);
        expect({
            custom: getMutableRootState().custom,
            hasLegacyCurrentFile: Object.hasOwn(
                getMutableRootState(),
                "currentFile"
            ),
            legacyCurrentFile: getMutableRootState().currentFile,
            rawData: getRootState().fitFile.rawData,
        }).toStrictEqual({
            custom: undefined,
            hasLegacyCurrentFile: false,
            legacyCurrentFile: undefined,
            rawData: null,
        });
        expect(Object.hasOwn(getRootState(), "currentFile")).toBe(false);
        expect(getRootState().fitFile.currentFile).toBeNull();
    });
});
