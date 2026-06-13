import { describe, expect, it, vi } from "vitest";

import { getComputedStateManagerRuntime } from "../../../../../electron-app/utils/state/core/computedStateManagerRuntime.js";

describe("computedStateManagerRuntime", () => {
    it("reads dark system preference through the scoped media query runtime", () => {
        expect.assertions(2);

        const matchMedia = vi.fn(() => ({ matches: true }) as MediaQueryList),
            runtime = getComputedStateManagerRuntime({ matchMedia });

        expect(runtime.isDarkSchemePreferred()).toBe(true);
        expect(matchMedia).toHaveBeenCalledWith("(prefers-color-scheme: dark)");
    });

    it("returns false when the system preference is not dark", () => {
        expect.assertions(1);

        const runtime = getComputedStateManagerRuntime({
            matchMedia: () => ({ matches: false }) as MediaQueryList,
        });

        expect(runtime.isDarkSchemePreferred()).toBe(false);
    });

    it("returns false when media queries are unavailable", () => {
        expect.assertions(1);

        expect(
            getComputedStateManagerRuntime({}).isDarkSchemePreferred()
        ).toBe(false);
    });
});
