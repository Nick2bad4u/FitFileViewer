import { beforeEach, describe, expect, it } from "vitest";

import * as stateManager from "../../../../../electron-app/utils/state/core/stateManager.js";
import {
    getRendererDragCounter,
    isRendererDropOverlayVisible,
    normalizeDragCounter,
    normalizeDropOverlayVisible,
    setRendererDragCounter,
    setRendererDropOverlayVisible,
} from "../../../../../electron-app/utils/state/domain/rendererDragDropState.js";

describe("rendererDragDropState", () => {
    beforeEach(() => {
        stateManager.__resetStateManagerForTests();
    });

    it("reads and writes drag counter through typed helpers", () => {
        expect.assertions(3);

        expect(getRendererDragCounter()).toBe(0);

        setRendererDragCounter(3, { source: "test" });
        expect(getRendererDragCounter()).toBe(3);

        setRendererDragCounter(-1, { source: "test" });
        expect(getRendererDragCounter()).toBe(0);
    });

    it("reads and writes drop overlay visibility through typed helpers", () => {
        expect.assertions(3);

        expect(isRendererDropOverlayVisible()).toBe(false);

        setRendererDropOverlayVisible(true, { source: "test" });
        expect(isRendererDropOverlayVisible()).toBe(true);

        setRendererDropOverlayVisible(false, { source: "test" });
        expect(isRendererDropOverlayVisible()).toBe(false);
    });

    it("normalizes drag/drop state values", () => {
        expect.assertions(6);

        expect(normalizeDragCounter(2)).toBe(2);
        expect(normalizeDragCounter("4")).toBe(4);
        expect(normalizeDragCounter(Number.NaN)).toBe(0);
        expect(normalizeDragCounter(-3)).toBe(0);
        expect(normalizeDropOverlayVisible("visible")).toBe(true);
        expect(normalizeDropOverlayVisible(0)).toBe(false);
    });

    it("stores normalized drag/drop values through direct state writes", () => {
        expect.assertions(4);

        stateManager.setState("ui.dragCounter", "4", { source: "test" });
        expect(stateManager.getState("ui.dragCounter")).toBe(4);

        stateManager.setState("ui.dragCounter", -1, { source: "test" });
        expect(stateManager.getState("ui.dragCounter")).toBe(0);

        stateManager.setState("ui.dropOverlay.visible", "visible", {
            source: "test",
        });
        expect(stateManager.getState("ui.dropOverlay.visible")).toBe(true);

        stateManager.setState("ui.dropOverlay.visible", 0, { source: "test" });
        expect(stateManager.getState("ui.dropOverlay.visible")).toBe(false);
    });
});
