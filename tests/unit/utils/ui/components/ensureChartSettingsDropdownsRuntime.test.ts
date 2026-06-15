import { describe, expect, it, vi } from "vitest";

import { getEnsureChartSettingsDropdownsRuntime } from "../../../../../electron-app/utils/ui/components/ensureChartSettingsDropdownsRuntime.js";

describe("getEnsureChartSettingsDropdownsRuntime", () => {
    it("creates elements and exposes the injected document body", () => {
        expect.assertions(3);

        const runtime = getEnsureChartSettingsDropdownsRuntime({ document });

        expect(runtime.document).toBe(document);
        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.getBody()).toBe(document.body);
    });

    it("checks HTMLElement instances through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            document,
            HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement(document.createTextNode("label"))).toBe(
            false
        );
    });

    it("schedules deferred work through the injected timer", () => {
        expect.assertions(3);

        const setTimeoutMock = vi.fn((callback: () => void, delay: number) => {
            callback();
            return 7 as ReturnType<typeof setTimeout>;
        });
        const runtime = getEnsureChartSettingsDropdownsRuntime({
            document,
            setTimeout: setTimeoutMock,
        });
        const callback = vi.fn();

        const handle = runtime.setTimeout(callback, 0);

        expect(handle).toBe(7);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 0);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getEnsureChartSettingsDropdownsRuntime({ document });

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            AbortController,
            document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(5);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            document: {
                createElement: document.createElement.bind(document),
                body: document.body,
            } as Document,
            HTMLElement: "HTMLElement" as unknown as typeof HTMLElement,
        });
        const runtimeWithoutAbortController =
            getEnsureChartSettingsDropdownsRuntime({
                document: {
                    body: document.body,
                    createElement: document.createElement.bind(document),
                } as Document,
            });
        const runtimeWithInvalidAbortController =
            getEnsureChartSettingsDropdownsRuntime({
                AbortController:
                    "AbortController" as unknown as typeof AbortController,
                document,
            });

        expect(() => getEnsureChartSettingsDropdownsRuntime({})).toThrow(
            "ensureChartSettingsDropdowns requires a document runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "ensureChartSettingsDropdowns requires an AbortController runtime"
        );
        expect(() =>
            runtimeWithoutAbortController.createAbortController()
        ).toThrow(
            "ensureChartSettingsDropdowns requires an AbortController runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "ensureChartSettingsDropdowns requires an HTMLElement runtime"
        );
        expect(() =>
            getEnsureChartSettingsDropdownsRuntime({
                document,
                setTimeout: "setTimeout" as unknown as typeof setTimeout,
            }).setTimeout(() => {}, 0)
        ).toThrow("ensureChartSettingsDropdowns requires a setTimeout runtime");
    });
});
