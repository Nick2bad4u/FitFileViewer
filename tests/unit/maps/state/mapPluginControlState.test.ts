import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearRegisteredMapDrawnItems,
    getRegisteredMapDrawControl,
    getRegisteredMapDrawnItems,
    getRegisteredMapMiniMapControl,
    removeRegisteredMapDrawControl,
    removeRegisteredMapMiniMapControl,
    resetRegisteredMapPluginControlsForTests,
    setRegisteredMapDrawControl,
    setRegisteredMapDrawnItems,
    setRegisteredMapMiniMapControl,
} from "../../../../electron-app/utils/maps/state/mapPluginControlState.js";

describe("mapPluginControlState", () => {
    beforeEach(() => {
        resetRegisteredMapPluginControlsForTests();
    });

    it("registers draw control, drawn items, and minimap control", () => {
        expect.assertions(3);

        const drawControl = { remove: vi.fn<() => void>() };
        const drawnItems = { getLayers: vi.fn<() => unknown[]>(() => []) };
        const miniMapControl = {
            _miniMap: { invalidateSize: vi.fn<() => void>() },
        };

        setRegisteredMapDrawControl(drawControl);
        setRegisteredMapDrawnItems(drawnItems);
        setRegisteredMapMiniMapControl(miniMapControl);

        expect(getRegisteredMapDrawControl()).toBe(drawControl);
        expect(getRegisteredMapDrawnItems()).toBe(drawnItems);
        expect(getRegisteredMapMiniMapControl()).toBe(miniMapControl);
    });

    it("clears registered drawn layers without removing the draw control", () => {
        expect.assertions(3);

        const clearLayers = vi.fn<() => void>();
        const drawControl = { remove: vi.fn<() => void>() };
        const drawnItems = { clearLayers };
        setRegisteredMapDrawControl(drawControl);
        setRegisteredMapDrawnItems(drawnItems);

        clearRegisteredMapDrawnItems();

        expect(clearLayers).toHaveBeenCalledOnce();
        expect(getRegisteredMapDrawControl()).toBe(drawControl);
        expect(getRegisteredMapDrawnItems()).toBe(drawnItems);
    });

    it("removes and clears disposable draw and minimap controls", () => {
        expect.assertions(4);

        const drawRemove = vi.fn<() => void>();
        const miniMapRemove = vi.fn<() => void>();
        setRegisteredMapDrawControl({ remove: drawRemove });
        setRegisteredMapMiniMapControl({ remove: miniMapRemove });

        removeRegisteredMapDrawControl();
        removeRegisteredMapMiniMapControl();

        expect(drawRemove).toHaveBeenCalledOnce();
        expect(miniMapRemove).toHaveBeenCalledOnce();
        expect(getRegisteredMapDrawControl()).toBeNull();
        expect(getRegisteredMapMiniMapControl()).toBeNull();
    });

    it("clears disposable controls even when remove throws", () => {
        expect.assertions(4);

        const drawError = new Error("draw remove failed");
        const miniMapError = new Error("minimap remove failed");
        setRegisteredMapDrawControl({
            remove: vi.fn<() => void>(() => {
                throw drawError;
            }),
        });
        setRegisteredMapMiniMapControl({
            remove: vi.fn<() => void>(() => {
                throw miniMapError;
            }),
        });

        expect(() => removeRegisteredMapDrawControl()).toThrow(drawError);
        expect(() => removeRegisteredMapMiniMapControl()).toThrow(miniMapError);
        expect(getRegisteredMapDrawControl()).toBeNull();
        expect(getRegisteredMapMiniMapControl()).toBeNull();
    });

    it("resets all plugin-control references for tests", () => {
        expect.assertions(3);

        setRegisteredMapDrawControl({ remove: vi.fn<() => void>() });
        setRegisteredMapDrawnItems({ getLayers: vi.fn<() => unknown[]>() });
        setRegisteredMapMiniMapControl({
            _miniMap: { invalidateSize: vi.fn<() => void>() },
        });

        resetRegisteredMapPluginControlsForTests();

        expect(getRegisteredMapDrawControl()).toBeNull();
        expect(getRegisteredMapDrawnItems()).toBeNull();
        expect(getRegisteredMapMiniMapControl()).toBeNull();
    });
});
