import { afterEach, describe, expect, it, vi } from "vitest";

import {
    clearMapLibreLayerFactoryForTests,
    registerMapLibreLayerFactory,
    resolveMapLibreLayerFactory,
    resolveMapLibreLayerFactoryFromCandidate,
} from "../../../../electron-app/utils/maps/layers/mapLibreLayerRuntime.js";

describe("mapLibreLayerRuntime", () => {
    afterEach(() => {
        clearMapLibreLayerFactoryForTests();
    });

    it("stores the registered MapLibre layer factory in module-local state", () => {
        expect.assertions(2);

        const factory = vi.fn(() => ({ kind: "vector" }));

        registerMapLibreLayerFactory(factory);

        expect(resolveMapLibreLayerFactory()).toBe(factory);
        expect(
            resolveMapLibreLayerFactory()?.({ style: "demo" })
        ).toStrictEqual({ kind: "vector" });
    });

    it("clears the registered factory for isolated tests and reloads", () => {
        expect.assertions(2);

        registerMapLibreLayerFactory(vi.fn(() => ({})));
        clearMapLibreLayerFactoryForTests();

        expect(resolveMapLibreLayerFactory()).toBeNull();
        clearMapLibreLayerFactoryForTests();
        expect(resolveMapLibreLayerFactory()).toBeNull();
    });

    it("extracts only callable MapLibre plugin factories from candidates", () => {
        expect.assertions(4);

        const factory = vi.fn(() => ({ kind: "vector" }));

        expect(
            resolveMapLibreLayerFactoryFromCandidate({ maplibreGL: factory })
        ).toBe(factory);
        expect(resolveMapLibreLayerFactoryFromCandidate(null)).toBeUndefined();
        expect(
            resolveMapLibreLayerFactoryFromCandidate({
                maplibreGL: "not-a-function",
            })
        ).toBeUndefined();
        expect(
            resolveMapLibreLayerFactoryFromCandidate({ tileLayer: factory })
        ).toBeUndefined();
    });
});
