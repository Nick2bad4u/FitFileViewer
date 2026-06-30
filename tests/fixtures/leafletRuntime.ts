import type { RegisteredLeafletRuntime } from "../../electron-app/utils/maps/core/leafletRuntime.js";

type LeafletRuntimeOverrides = Readonly<Record<string, unknown>>;

class TestLeafletLayer {}

export function createRegisteredLeafletRuntime<
    TOverrides extends LeafletRuntimeOverrides,
>(overrides: TOverrides): RegisteredLeafletRuntime & TOverrides {
    return {
        control: {},
        Layer: TestLeafletLayer,
        map: () => undefined,
        tileLayer: () => undefined,
        ...overrides,
    };
}
