import { afterEach, describe, expect, it } from "vitest";

import {
    clearLeafletRuntimeForTests,
    resolveLeafletRuntime,
    setLeafletRuntime,
} from "../../../../../electron-app/utils/maps/core/leafletRuntime.js";

type TestLeafletRuntime = {
    divIcon: () => unknown;
};

interface LeafletRuntimeRegistry {
    runtime?: unknown;
}

const leafletRuntimeRegistryKey = Symbol.for("fitfileviewer.leafletRuntime");

function getLeafletRuntimeRegistry(): LeafletRuntimeRegistry {
    const leafletGlobal = globalThis as typeof globalThis &
        Record<symbol, LeafletRuntimeRegistry | undefined>;
    leafletGlobal[leafletRuntimeRegistryKey] ??= {};
    return leafletGlobal[leafletRuntimeRegistryKey];
}

function isTestLeafletRuntime(value: unknown): value is TestLeafletRuntime {
    return (
        typeof value === "object" &&
        value !== null &&
        "divIcon" in value &&
        typeof value.divIcon === "function"
    );
}

afterEach(() => {
    clearLeafletRuntimeForTests();
    Reflect.deleteProperty(globalThis, "L");
});

describe("leafletRuntime", () => {
    it("resolves an explicitly registered runtime", () => {
        expect.assertions(1);

        const registeredRuntime = { divIcon: () => "registered" };

        setLeafletRuntime(registeredRuntime);

        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBe(
            registeredRuntime
        );
    });

    it("reads runtimes registered by a separate bundle through the shared symbol registry", () => {
        expect.assertions(1);

        const runtime = { divIcon: () => "registered" };
        getLeafletRuntimeRegistry().runtime = runtime;

        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBe(runtime);
    });
});
