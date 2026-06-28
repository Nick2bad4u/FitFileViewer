import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererLoadingIndicator,
    getRendererLoadingFromState,
    isRendererLoading,
    normalizeRendererLoading,
    normalizeRendererLoadingIndicator,
    setRendererLoading,
    subscribeToRendererLoadingIndicator,
    subscribeToRendererLoading as subscribeToLoading,
    updateRendererLoadingIndicator,
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

    it("reads and writes loading indicator state through typed helpers", () => {
        expect.assertions(2);

        updateRendererLoadingIndicator(
            { active: true, progress: 45 },
            { source: "test" }
        );

        expect(getRendererLoadingIndicator()).toStrictEqual({
            active: true,
            progress: 45,
        });
        expect(stateManager.getState("ui.loadingIndicator")).toStrictEqual({
            active: true,
            progress: 45,
        });
    });

    it("normalizes loading indicator values", () => {
        expect.assertions(4);

        expect(
            normalizeRendererLoadingIndicator({
                active: true,
                progress: 25,
            })
        ).toStrictEqual({ active: true, progress: 25 });
        expect(
            normalizeRendererLoadingIndicator({
                active: "yes",
                progress: "25",
            })
        ).toStrictEqual({ active: false, progress: 0 });
        expect(normalizeRendererLoadingIndicator(null)).toStrictEqual({
            active: false,
            progress: 0,
        });

        stateManager.setState("ui.loadingIndicator", {
            active: "yes",
            progress: "25",
        });
        expect(stateManager.getState("ui.loadingIndicator")).toStrictEqual({
            active: false,
            progress: 0,
        });
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

    it("subscribes with normalized loading indicator values", () => {
        expect.assertions(2);

        const received: unknown[] = [];
        const subscriptionCleanups: Array<() => void> = [];
        subscriptionCleanups.push(
            subscribeToRendererLoadingIndicator((indicator) => {
                received.push(indicator);
            })
        );

        updateRendererLoadingIndicator(
            { active: true, progress: 60 },
            { source: "test" }
        );
        stateManager.setState("ui.loadingIndicator", {
            active: "yes",
            progress: "bad",
        });

        expect(received).toStrictEqual([
            { active: true, progress: 60 },
            { active: false, progress: 0 },
        ]);

        for (const cleanup of subscriptionCleanups) {
            cleanup();
        }
        updateRendererLoadingIndicator(
            { active: true, progress: 90 },
            { source: "test" }
        );
        expect(received).toStrictEqual([
            { active: true, progress: 60 },
            { active: false, progress: 0 },
        ]);
    });
});
