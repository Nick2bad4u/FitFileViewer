import type { DivIconOptions } from "leaflet";

import { describe, expect, it, vi } from "vitest";

import { createRegisteredLeafletRuntime } from "../../../../fixtures/leafletRuntime.js";

async function loadLeafletRuntime() {
    return import("../../../../../electron-app/utils/maps/core/leafletRuntime.js");
}

describe("map marker icons", () => {
    it("creates start and end icons through the registered Leaflet runtime", async () => {
        expect.assertions(3);

        const divIcon = vi.fn<
            (options: DivIconOptions) => { options: DivIconOptions }
        >((options) => ({ options }));

        try {
            vi.resetModules();
            const { registerLeafletRuntime } = await loadLeafletRuntime();
            registerLeafletRuntime(
                createRegisteredLeafletRuntime({
                    divIcon,
                })
            );

            const { createEndIcon, createStartIcon } =
                await import("../../../../../electron-app/utils/maps/layers/mapIcons.js");

            expect(createStartIcon()).toStrictEqual({
                options: {
                    className: "ffv-map-marker ffv-map-marker--start",
                    html: '<span class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">S</span></span>',
                    iconAnchor: [14, 37],
                    iconSize: [28, 37],
                    popupAnchor: [0, -37],
                },
            });
            expect(createEndIcon()).toStrictEqual({
                options: {
                    className: "ffv-map-marker ffv-map-marker--end",
                    html: '<span class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">E</span></span>',
                    iconAnchor: [14, 37],
                    iconSize: [28, 37],
                    popupAnchor: [0, -37],
                },
            });
            expect(divIcon).toHaveBeenCalledTimes(2);
        } finally {
            const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
            clearLeafletRuntimeForTests();
            vi.unstubAllGlobals();
            vi.resetModules();
        }
    });

    it("falls back to empty marker icons when Leaflet is missing", async () => {
        expect.assertions(2);

        vi.resetModules();
        const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
        clearLeafletRuntimeForTests();
        vi.unstubAllGlobals();
        const { createEndIcon, createStartIcon } =
            await import("../../../../../electron-app/utils/maps/layers/mapIcons.js");

        expect(createStartIcon()).toStrictEqual({});
        expect(createEndIcon()).toStrictEqual({});
    });

    it("uses Leaflet when the runtime is registered after module import", async () => {
        expect.assertions(2);

        const divIcon = vi.fn<
            (options: DivIconOptions) => { options: DivIconOptions }
        >((options) => ({ options }));

        try {
            vi.resetModules();
            const { clearLeafletRuntimeForTests, registerLeafletRuntime } =
                await loadLeafletRuntime();
            clearLeafletRuntimeForTests();
            vi.unstubAllGlobals();

            const { createStartIcon } =
                await import("../../../../../electron-app/utils/maps/layers/mapIcons.js");

            registerLeafletRuntime(
                createRegisteredLeafletRuntime({
                    divIcon,
                })
            );

            expect(createStartIcon()).toStrictEqual({
                options: {
                    className: "ffv-map-marker ffv-map-marker--start",
                    html: '<span class="ffv-map-marker__pin" aria-hidden="true"><span class="ffv-map-marker__glyph">S</span></span>',
                    iconAnchor: [14, 37],
                    iconSize: [28, 37],
                    popupAnchor: [0, -37],
                },
            });
            expect(divIcon).toHaveBeenCalledTimes(1);
        } finally {
            const { clearLeafletRuntimeForTests } = await loadLeafletRuntime();
            clearLeafletRuntimeForTests();
            vi.unstubAllGlobals();
            vi.resetModules();
        }
    });
});
