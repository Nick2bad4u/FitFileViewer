import { afterEach, describe, expect, it } from "vitest";

import {
    clearScreenfullRuntimeForTests,
    isScreenfullRuntime,
    resolveScreenfullRuntime,
    setScreenfullRuntime,
} from "../../../../../electron-app/utils/ui/controls/screenfullRuntime.js";

describe("screenfullRuntime", () => {
    afterEach(() => {
        clearScreenfullRuntimeForTests();
    });

    it("resolves a registered screenfull-compatible runtime", () => {
        expect.assertions(2);

        const runtime = {
            isEnabled: true,
            isFullscreen: false,
            on: () => undefined,
        };

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
});
