import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    getRegisteredLeafletMapInstance,
    removeRegisteredLeafletMapInstance,
    resetRegisteredLeafletMapInstanceForTests,
    setRegisteredLeafletMapInstance,
} from "../../../../electron-app/utils/maps/state/mapLeafletInstanceState.js";

describe("mapLeafletInstanceState", () => {
    beforeEach(() => {
        resetRegisteredLeafletMapInstanceForTests();
    });

    it("registers and returns the current Leaflet map instance", () => {
        expect.assertions(1);

        const mapInstance = { invalidateSize: vi.fn<() => void>() };

        setRegisteredLeafletMapInstance(mapInstance);

        expect(getRegisteredLeafletMapInstance()).toBe(mapInstance);
    });

    it("removes and clears the registered map instance", () => {
        expect.assertions(2);

        const remove = vi.fn<() => void>();
        setRegisteredLeafletMapInstance({ remove });

        removeRegisteredLeafletMapInstance();

        expect(remove).toHaveBeenCalledOnce();
        expect(getRegisteredLeafletMapInstance()).toBeNull();
    });

    it("clears the registered map instance even when removal throws", () => {
        expect.assertions(2);

        const error = new Error("remove failed");
        const remove = vi.fn<() => void>(() => {
            throw error;
        });
        setRegisteredLeafletMapInstance({ remove });

        expect(() => removeRegisteredLeafletMapInstance()).toThrow(error);
        expect(getRegisteredLeafletMapInstance()).toBeNull();
    });
});
