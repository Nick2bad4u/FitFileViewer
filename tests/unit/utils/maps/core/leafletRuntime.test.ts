import { afterEach, describe, expect, it } from "vitest";

import {
    clearLeafletRuntimeForTests,
    resolveLeafletRuntime,
    setLeafletRuntime,
} from "../../../../../electron-app/utils/maps/core/leafletRuntime.js";

type TestLeafletRuntime = {
    divIcon: () => unknown;
};

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

    it("clears the module-local runtime adapter", () => {
        expect.assertions(1);

        const runtime = { divIcon: () => "registered" };
        setLeafletRuntime(runtime);

        clearLeafletRuntimeForTests();

        expect(resolveLeafletRuntime(isTestLeafletRuntime)).toBeNull();
    });
});
