import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    clearRegisteredMapMeasurements,
    getRegisteredMapMeasureControl,
    removeRegisteredMapMeasureControl,
    resetRegisteredMapMeasureControlForTests,
    setRegisteredMapMeasureControl,
} from "../../../../electron-app/utils/maps/state/mapMeasureControlState.js";

describe("mapMeasureControlState", () => {
    beforeEach(() => {
        resetRegisteredMapMeasureControlForTests();
    });

    it("registers and returns the current measure control", () => {
        expect.assertions(1);

        const control = { clearMeasurements: vi.fn<() => void>() };

        setRegisteredMapMeasureControl(control);

        expect(getRegisteredMapMeasureControl()).toBe(control);
    });

    it("clears measurements through the registered control", () => {
        expect.assertions(2);

        const clearMeasurements = vi.fn<() => void>();
        const control = { clearMeasurements };
        setRegisteredMapMeasureControl(control);

        clearRegisteredMapMeasurements();

        expect(getRegisteredMapMeasureControl()).toBe(control);
        expect(clearMeasurements).toHaveBeenCalledOnce();
    });

    it("removes and clears the registered control", () => {
        expect.assertions(2);

        const remove = vi.fn<() => void>();
        setRegisteredMapMeasureControl({ remove });

        removeRegisteredMapMeasureControl();

        expect(remove).toHaveBeenCalledOnce();
        expect(getRegisteredMapMeasureControl()).toBeNull();
    });

    it("clears the registered control even when remove throws", () => {
        expect.assertions(2);

        const error = new Error("remove failed");
        const remove = vi.fn<() => void>(() => {
            throw error;
        });
        setRegisteredMapMeasureControl({ remove });

        expect(() => removeRegisteredMapMeasureControl()).toThrow(error);
        expect(getRegisteredMapMeasureControl()).toBeNull();
    });
});
