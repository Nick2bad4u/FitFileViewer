import { afterEach, describe, expect, it } from "vitest";

import {
    clearDataTableRuntimeForTests,
    resolveDataTableRuntime,
    setDataTableRuntime,
} from "../../../../../electron-app/utils/rendering/core/dataTableRuntime.js";

function isDataTableRuntime(
    value: unknown
): value is { isDataTable: () => void } {
    return (
        typeof value === "function" &&
        typeof (value as { isDataTable?: unknown }).isDataTable === "function"
    );
}

describe("dataTableRuntime", () => {
    afterEach(() => {
        clearDataTableRuntimeForTests();
    });

    it("resolves the registered DataTables runtime", () => {
        expect.assertions(1);

        const runtime = Object.assign(function DataTableRuntime() {}, {
            isDataTable() {},
        });

        setDataTableRuntime(runtime);

        expect(resolveDataTableRuntime(isDataTableRuntime)).toBe(runtime);
    });

    it("clears the module-local runtime adapter", () => {
        expect.assertions(1);

        const runtime = Object.assign(function DataTableRuntime() {}, {
            isDataTable() {},
        });
        setDataTableRuntime(runtime);

        clearDataTableRuntimeForTests();

        expect(resolveDataTableRuntime(isDataTableRuntime)).toBeNull();
    });
});
