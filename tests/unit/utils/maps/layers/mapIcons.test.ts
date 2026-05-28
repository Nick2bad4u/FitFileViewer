import type { DivIconOptions } from "leaflet";

import { describe, expect, it, vi } from "vitest";

describe("map marker icons", () => {
    it("creates start and end icons through the Leaflet global", async () => {
        expect.assertions(3);

        const divIcon = vi.fn<
            (options: DivIconOptions) => { options: DivIconOptions }
        >((options) => ({ options }));

        try {
            vi.resetModules();
            vi.stubGlobal("L", {
                divIcon,
            });

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
            vi.unstubAllGlobals();
            vi.resetModules();
        }
    });

    it("falls back to empty marker icons when Leaflet is missing", async () => {
        expect.assertions(2);

        vi.resetModules();
        vi.unstubAllGlobals();
        const { createEndIcon, createStartIcon } =
            await import("../../../../../electron-app/utils/maps/layers/mapIcons.js");

        expect(createStartIcon()).toStrictEqual({});
        expect(createEndIcon()).toStrictEqual({});
    });
});
