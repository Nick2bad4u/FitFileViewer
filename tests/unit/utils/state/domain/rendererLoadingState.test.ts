import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererLoadingFromState,
    isRendererLoading,
    normalizeRendererLoading,
    setRendererLoading,
    subscribeToRendererLoading as subscribeToLoading,
} from "../../../../../electron-app/utils/state/domain/rendererLoadingState.js";

describe("rendererLoadingState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes renderer loading through typed helpers", () => {
        expect.assertions(3);

        expect(isRendererLoading()).toBe(false);

        setRendererLoading(true, { source: "test" });
        expect(isRendererLoading()).toBe(true);

        setRendererLoading(false, { source: "test" });
        expect(isRendererLoading()).toBe(false);
    });

    it("normalizes only true as active loading state", () => {
        expect.assertions(4);

        expect(normalizeRendererLoading(true)).toBe(true);
        expect(normalizeRendererLoading(false)).toBe(false);
        expect(normalizeRendererLoading("true")).toBe(false);
        expect(normalizeRendererLoading(1)).toBe(false);
    });

    it("reads loading from an injected state reader", () => {
        expect.assertions(2);

        expect(getRendererLoadingFromState(() => true)).toBe(true);
        expect(getRendererLoadingFromState(() => "loading")).toBe(false);
    });

    it("subscribes with normalized loading values", () => {
        expect.assertions(2);

        const received: boolean[] = [];
        const unsubscribe = subscribeToLoading((loading) => {
            received.push(loading);
        });

        setRendererLoading(true, { source: "test" });
        stateManager.setState("isLoading", "bad", { source: "test" });
        setRendererLoading(false, { source: "test" });
        unsubscribe();

        expect(received).toStrictEqual([true, false]);
        expect(stateManager.getState("isLoading")).toBe(false);
    });
});
