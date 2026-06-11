import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererTheme,
    normalizeRendererTheme,
    setRendererTheme,
} from "../../../../../electron-app/utils/state/domain/rendererThemeState.js";

describe("rendererThemeState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes renderer theme state", () => {
        expect.assertions(2);

        expect(getRendererTheme()).toBe("system");

        setRendererTheme("dark", { source: "test" });
        expect(getRendererTheme()).toBe("dark");
    });

    it("normalizes empty values to system", () => {
        expect.assertions(4);

        expect(normalizeRendererTheme("light")).toBe("light");
        expect(normalizeRendererTheme("")).toBe("system");
        expect(normalizeRendererTheme("   ")).toBe("system");
        expect(normalizeRendererTheme(undefined)).toBe("system");
    });
});
