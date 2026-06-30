import { afterEach, describe, expect, it } from "vitest";

import {
    clearScreenfullRuntimeForTests,
    isScreenfullRuntime,
    registerScreenfullRuntime,
    resolveScreenfullRuntime,
    setScreenfullRuntime,
    type ScreenfullRuntime,
} from "../../../../../electron-app/utils/ui/controls/screenfullRuntime.js";

describe("screenfullRuntime", () => {
    afterEach(() => {
        clearScreenfullRuntimeForTests();
    });

    function createScreenfullRuntime(): ScreenfullRuntime {
        return {
            isEnabled: true,
            isFullscreen: false,
            on: () => undefined,
        };
    }

    it("registers a typed screenfull runtime after vendor payload validation", () => {
        expect.assertions(1);

        const runtime = createScreenfullRuntime();

        registerScreenfullRuntime(runtime);

        expect(resolveScreenfullRuntime()).toBe(runtime);
    });

    it("resolves a registered screenfull-compatible runtime", () => {
        expect.assertions(2);

        const runtime = createScreenfullRuntime();

        setScreenfullRuntime(runtime);

        expect(isScreenfullRuntime(runtime)).toBe(true);
        expect(resolveScreenfullRuntime()).toBe(runtime);
    });

    it("ignores malformed runtimes", () => {
        expect.assertions(3);

        setScreenfullRuntime({
            isEnabled: true,
            isFullscreen: false,
        });

        expect(
            isScreenfullRuntime({
                isEnabled: true,
                isFullscreen: false,
            })
        ).toBe(false);
        expect(
            isScreenfullRuntime([
                true,
                false,
                () => undefined,
            ])
        ).toBe(false);
        expect(resolveScreenfullRuntime()).toBeUndefined();
    });

    it("ignores screenfull runtimes with throwing property accessors", () => {
        expect.assertions(2);

        const runtime = Object.defineProperty(
            {
                isFullscreen: false,
                on: () => undefined,
            },
            "isEnabled",
            {
                get() {
                    throw new Error("screenfull unavailable");
                },
            }
        );

        setScreenfullRuntime(runtime);

        expect(isScreenfullRuntime(runtime)).toBe(false);
        expect(resolveScreenfullRuntime()).toBeUndefined();
    });
});
