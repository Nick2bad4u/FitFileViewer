import { afterEach, describe, expect, it } from "vitest";

import {
    clearDataTableRuntimeForTests,
    resolveDataTableRuntime,
    setDataTableRuntime,
} from "../../../../../electron-app/utils/rendering/core/dataTableRuntime.js";

interface DataTableRuntimeRegistry {
    runtime?: unknown;
}

const dataTableRuntimeRegistryKey = Symbol.for(
    "fitfileviewer.dataTableRuntime"
);

function getDataTableRuntimeRegistry(): DataTableRuntimeRegistry {
    const dataTableGlobal = globalThis as typeof globalThis &
        Record<symbol, DataTableRuntimeRegistry | undefined>;
    dataTableGlobal[dataTableRuntimeRegistryKey] ??= {};
    return dataTableGlobal[dataTableRuntimeRegistryKey];
}

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

    it("reads runtimes registered by a separate bundle through the shared symbol registry", () => {
        expect.assertions(1);

        const runtime = Object.assign(function DataTableRuntime() {}, {
            isDataTable() {},
        });
        getDataTableRuntimeRegistry().runtime = runtime;

        expect(resolveDataTableRuntime(isDataTableRuntime)).toBe(runtime);
    });
});
