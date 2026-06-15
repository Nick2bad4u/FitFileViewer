import { afterEach, describe, expect, it, vi } from "vitest";

import { getExportUtilsRuntime } from "../../../../../electron-app/utils/files/export/exportUtilsRuntime.js";

describe("exportUtilsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses default browser function providers without exposing a window scope", () => {
        expect.assertions(4);

        const confirmDangerousAction = vi.fn(() => true);
        const popup = {} as Window;
        const openPrintWindow = vi.fn(() => popup);
        vi.stubGlobal("confirm", confirmDangerousAction);
        vi.stubGlobal("open", openPrintWindow);

        const exportUtils = getExportUtilsRuntime();

        expect(
            exportUtils.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(true);
        expect(
            exportUtils.openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBe(popup);
        expect(confirmDangerousAction).toHaveBeenCalledWith(
            "Clear saved export tokens?"
        );
        expect(openPrintWindow).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("confirms dangerous actions through the scoped confirmation runtime", () => {
        expect.assertions(2);

        const confirmDangerousAction = vi.fn(() => true),
            runtime = getExportUtilsRuntime({
                confirmDangerousAction,
            });

        expect(
            runtime.confirmDangerousAction("Clear saved export tokens?")
        ).toBe(true);
        expect(confirmDangerousAction).toHaveBeenCalledWith(
            "Clear saved export tokens?"
        );
    });

    it("rejects dangerous actions when no confirmation runtime exists", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime({}).confirmDangerousAction(
                "Clear saved export tokens?"
            )
        ).toBe(false);
    });

    it("opens print windows through the scoped print-window runtime", () => {
        expect.assertions(2);

        const popup = {} as Window;
        const openPrintWindow = vi.fn(() => popup);
        const runtime = getExportUtilsRuntime({
            openPrintWindow,
        });

        expect(
            runtime.openPrintWindow("", "_blank", "noopener,noreferrer")
        ).toBe(popup);
        expect(openPrintWindow).toHaveBeenCalledWith(
            "",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("returns null when print-window opening is unavailable", () => {
        expect.assertions(1);

        expect(
            getExportUtilsRuntime({}).openPrintWindow(
                "",
                "_blank",
                "noopener,noreferrer"
            )
        ).toBeNull();
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
