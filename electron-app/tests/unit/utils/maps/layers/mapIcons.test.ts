import type { IconOptions } from "leaflet";

import { describe, expect, it, vi } from "vitest";

describe("map marker icons", () => {
    it("creates start and end icons through the Leaflet global", async () => {
        expect.assertions(3);

        const icon = vi.fn<(options: IconOptions) => { options: IconOptions }>(
            (options) => ({ options })
        );

        try {
            vi.resetModules();
            vi.stubGlobal("L", {
                divIcon: vi.fn<() => Record<string, never>>(() => ({})),
                icon,
            });

            const { createEndIcon, createStartIcon } = await import(
                "../../../../../utils/maps/layers/mapIcons.js"
            );

            expect(createStartIcon()).toStrictEqual({
                options: {
                    iconAnchor: [16, 32],
                    iconSize: [32, 32],
                    iconUrl: "assets/map-icons/start-icon.png",
                    popupAnchor: [0, -32],
                },
            });
            expect(createEndIcon()).toStrictEqual({
                options: {
                    iconAnchor: [16, 32],
                    iconSize: [32, 32],
                    iconUrl: "assets/map-icons/end-icon.png",
                    popupAnchor: [0, -32],
                },
            });
            expect(icon).toHaveBeenCalledTimes(2);
        } finally {
            vi.unstubAllGlobals();
            vi.resetModules();
        }
    });

    it("falls back to empty marker icons when Leaflet is missing", async () => {
        expect.assertions(2);

        vi.resetModules();
        vi.unstubAllGlobals();
        const { createEndIcon, createStartIcon } = await import(
            "../../../../../utils/maps/layers/mapIcons.js"
        );

        expect(createStartIcon()).toStrictEqual({});
        expect(createEndIcon()).toStrictEqual({});
    });
});
