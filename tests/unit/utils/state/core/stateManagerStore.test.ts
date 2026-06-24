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
        expect.assertions(5);

        const rootState = getRootState();
        const mutableRootState = getMutableRootState();

        mutableRootState.custom = { value: 1 };

        expect(mutableRootState).toBe(rootState);
        expect(getRootState()).toBe(rootState);
        expect(getMutableRootState().custom).toStrictEqual({ value: 1 });

        resetRootState();

        expect(getRootState()).toBe(rootState);
        expect({
            custom: getMutableRootState().custom,
            rawData: getRootState().fitFile.rawData,
        }).toStrictEqual({
            custom: undefined,
            rawData: null,
        });
    });
});
