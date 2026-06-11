import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    areRendererTabButtonsEnabled,
    normalizeRendererTabButtonsEnabled,
    setRendererTabButtonsEnabled,
} from "../../../../../electron-app/utils/state/domain/rendererTabButtonsState.js";

describe("rendererTabButtonsState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes renderer tab-button enabled state", () => {
        expect.assertions(3);

        expect(areRendererTabButtonsEnabled()).toBe(false);

        setRendererTabButtonsEnabled(true, { source: "test" });
        expect(areRendererTabButtonsEnabled()).toBe(true);

        setRendererTabButtonsEnabled(false, { source: "test" });
        expect(areRendererTabButtonsEnabled()).toBe(false);
    });

    it("normalizes only true as enabled", () => {
        expect.assertions(4);

        expect(normalizeRendererTabButtonsEnabled(true)).toBe(true);
        expect(normalizeRendererTabButtonsEnabled(false)).toBe(false);
        expect(normalizeRendererTabButtonsEnabled("true")).toBe(false);
        expect(normalizeRendererTabButtonsEnabled(1)).toBe(false);
    });
});
