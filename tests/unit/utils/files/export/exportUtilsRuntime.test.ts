import { describe, expect, it } from "vitest";

import { getExportUtilsRuntime } from "../../../../../electron-app/utils/files/export/exportUtilsRuntime.js";

describe("exportUtilsRuntime", () => {
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

        expect(() =>
            getExportUtilsRuntime({}).createAbortController()
        ).toThrow("exportUtils requires an AbortController runtime");
    });
});
