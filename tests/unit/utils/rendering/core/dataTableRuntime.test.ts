import { afterEach, describe, expect, it } from "vitest";

import {
    clearDataTableRuntimeForTests,
    getRegisteredDataTableRuntime,
    isRegisteredDataTableRuntime,
    registerDataTableRuntime,
    type RegisteredDataTableRuntime,
    resolveDataTableRuntime,
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

    function createDataTableRuntime(): RegisteredDataTableRuntime {
        return Object.assign(
            function DataTableRuntime() {
                return {
                    columns: {
                        adjust() {},
                    },
                    destroy() {},
                };
            },
            {
                isDataTable() {
                    return false;
                },
            }
        );
    }

    it("registers typed DataTables runtime payloads after vendor validation", () => {
        expect.assertions(2);

        const runtime = createDataTableRuntime();

        registerDataTableRuntime(runtime);

        expect(getRegisteredDataTableRuntime()).toBe(runtime);
        expect(resolveDataTableRuntime(isDataTableRuntime)).toBe(runtime);
    });

    it("clears the module-local runtime adapter", () => {
        expect.assertions(2);

        const runtime = createDataTableRuntime();
        registerDataTableRuntime(runtime);

        clearDataTableRuntimeForTests();

        expect(getRegisteredDataTableRuntime()).toBeNull();
        expect(resolveDataTableRuntime(isDataTableRuntime)).toBeNull();
    });

    it("validates registered DataTables runtime payloads", () => {
        expect.assertions(4);

        const runtime = createDataTableRuntime();

        expect(isRegisteredDataTableRuntime(runtime)).toBe(true);
        expect(isRegisteredDataTableRuntime({ isDataTable() {} })).toBe(false);
        expect(
            isRegisteredDataTableRuntime(function DataTableRuntime() {})
        ).toBe(false);
        expect(isRegisteredDataTableRuntime(null)).toBe(false);
    });
});
