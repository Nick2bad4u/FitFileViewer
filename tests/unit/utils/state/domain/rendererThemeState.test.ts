import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererPreviousTheme,
    getRendererTheme,
    normalizeRendererTheme,
    setRendererPreviousTheme,
    setRendererTheme,
    subscribeToRendererTheme as subscribeToTheme,
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

    it("reads and writes previous renderer theme state", () => {
        expect.assertions(2);

        expect(getRendererPreviousTheme()).toBeUndefined();

        setRendererPreviousTheme("light", { source: "test" });
        expect(getRendererPreviousTheme()).toBe("light");
    });

    it("subscribes to renderer theme changes", () => {
        expect.assertions(2);

        const changes: unknown[] = [];
        const unsubscribe = subscribeToTheme((newValue) => {
            changes.push(newValue);
        });

        setRendererTheme("dark", { source: "test" });
        expect(changes).toStrictEqual(["dark"]);

        unsubscribe();
        setRendererTheme("light", { source: "test" });
        expect(changes).toStrictEqual(["dark"]);
    });

    it("normalizes empty values to system", () => {
        expect.assertions(4);

        expect(normalizeRendererTheme("light")).toBe("light");
        expect(normalizeRendererTheme("")).toBe("system");
        expect(normalizeRendererTheme("   ")).toBe("system");
        expect(normalizeRendererTheme(undefined)).toBe("system");
    });
});
