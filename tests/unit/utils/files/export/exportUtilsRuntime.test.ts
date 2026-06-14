import { describe, expect, it, vi } from "vitest";

import { getExportUtilsRuntime } from "../../../../../electron-app/utils/files/export/exportUtilsRuntime.js";

describe("exportUtilsRuntime", () => {
    it("confirms dangerous actions through the scoped window runtime", () => {
        expect.assertions(2);

        const confirm = vi.fn(() => true),
            runtime = getExportUtilsRuntime({
                window: { confirm },
            });

        expect(
            runtime.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(true);
        expect(confirm).toHaveBeenCalledWith("Clear saved export tokens?");
    });

    it("rejects dangerous actions when no window confirmation runtime exists", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime({}).confirmDangerousAction(
                "Clear saved export tokens?"
            )
        ).toBe(false);
    });

    it("creates abort controllers through the scoped runtime", () => {
        expect.assertions(2);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }

        const runtime = getExportUtilsRuntime({
            AbortController:
                TestAbortController as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("throws when abort controllers are unavailable", () => {
        expect.assertions(1);

        expect(() => getExportUtilsRuntime({}).createAbortController()).toThrow(
            "exportUtils requires an AbortController runtime"
        );
    });
});
