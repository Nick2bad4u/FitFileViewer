import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    isRendererExporting,
    normalizeRendererExporting,
    setRendererExporting,
} from "../../../../../electron-app/utils/state/domain/rendererExportState.js";

describe("rendererExportState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes renderer exporting through typed helpers", () => {
        expect.assertions(3);

        expect(isRendererExporting()).toBe(false);

        setRendererExporting(true, { source: "test" });
        expect(isRendererExporting()).toBe(true);

        setRendererExporting(false, { source: "test" });
        expect(isRendererExporting()).toBe(false);
    });

    it("normalizes only true as exporting", () => {
        expect.assertions(4);

        expect(normalizeRendererExporting(true)).toBe(true);
        expect(normalizeRendererExporting(false)).toBe(false);
        expect(normalizeRendererExporting("true")).toBe(false);
        expect(normalizeRendererExporting(1)).toBe(false);
    });

    it("normalizes exporting state direct writes", () => {
        expect.assertions(2);

        stateManager.setState("ui.isExporting", "true", {
            source: "test",
        });
        expect(stateManager.getState("ui.isExporting")).toBe(false);

        stateManager.setState(
            "ui",
            {
                isExporting: true,
            },
            { source: "test" }
        );
        expect(stateManager.getState("ui.isExporting")).toBe(true);
    });
});
