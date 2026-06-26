import { afterEach, describe, expect, it, vi } from "vitest";

import type {
    BrowserAbortControllerConstructor,
    BrowserHTMLElementConstructor,
    BrowserSetTimeout,
    BrowserTimerHandle,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getEnsureChartSettingsDropdownsRuntime,
    type EnsureChartSettingsDropdownsRuntimeScope,
} from "../../../../../electron-app/utils/ui/components/ensureChartSettingsDropdownsRuntime.js";

describe("getEnsureChartSettingsDropdownsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates elements and exposes the injected document body", () => {
        expect.assertions(3);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getDocument: () => document,
        });

        expect(runtime.document).toBe(document);
        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.getBody()).toBe(document.body);
    });

    it("checks HTMLElement instances through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
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
            return 7 as BrowserTimerHandle;
        });
        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getDocument: () => document,
            getSetTimeout: () => setTimeoutMock,
        });
        const callback = vi.fn();

        const handle = runtime.setTimeout(callback, 0);

        expect(handle).toBe(7);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 0);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getDocument: () => document,
        });

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getAbortController: () => AbortController,
            getDocument: () => document,
        });
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getEnsureChartSettingsDropdownsRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production timer defaults", () => {
        expect.assertions(3);

        const setTimeoutMock = vi.fn((callback: () => void, delay: number) => {
            callback();
            return 11 as BrowserTimerHandle;
        });
        vi.stubGlobal("setTimeout", setTimeoutMock);

        const runtime = getEnsureChartSettingsDropdownsRuntime();
        const callback = vi.fn();
        const handle = runtime.setTimeout(callback, 0);

        expect(handle).toBe(11);
        expect(callback).toHaveBeenCalledOnce();
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 0);
    });

    it("uses browser runtime providers for production document and HTMLElement defaults", () => {
        expect.assertions(5);

        const runtime = getEnsureChartSettingsDropdownsRuntime();
        const element = runtime.createElement("div");
        const text = document.createTextNode("label");

        expect(runtime.document).toBe(document);
        expect(runtime.getBody()).toBe(document.body);
        expect(element).toBeInstanceOf(HTMLElement);
        expect(runtime.isHTMLElement(element)).toBe(true);
        expect(runtime.isHTMLElement(text)).toBe(false);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(5);

        const runtime = getEnsureChartSettingsDropdownsRuntime({
            getDocument: () =>
                ({
                    createElement: document.createElement.bind(document),
                    body: document.body,
                }) as Document,
            getHTMLElement: () =>
                "HTMLElement" as unknown as BrowserHTMLElementConstructor,
        });
        const runtimeWithoutAbortController =
            getEnsureChartSettingsDropdownsRuntime({
                getDocument: () =>
                    ({
                        body: document.body,
                        createElement: document.createElement.bind(document),
                    }) as Document,
            });
        const runtimeWithInvalidAbortController =
            getEnsureChartSettingsDropdownsRuntime({
                getAbortController: () =>
                    "AbortController" as unknown as BrowserAbortControllerConstructor,
                getDocument: () => document,
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
                getDocument: () => document,
                getSetTimeout: () =>
                    "setTimeout" as unknown as BrowserSetTimeout,
            }).setTimeout(() => {}, 0)
        ).toThrow("ensureChartSettingsDropdowns requires a setTimeout runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const legacyDirectScope = {
            AbortController,
            document,
            HTMLElement,
            setTimeout,
        } as unknown as EnsureChartSettingsDropdownsRuntimeScope;
        const mixedLegacyScope = {
            AbortController,
            getDocument: () => document,
            HTMLElement,
            setTimeout,
        } as unknown as EnsureChartSettingsDropdownsRuntimeScope;
        const runtime =
            getEnsureChartSettingsDropdownsRuntime(mixedLegacyScope);

        expect(() =>
            getEnsureChartSettingsDropdownsRuntime(legacyDirectScope)
        ).toThrow("ensureChartSettingsDropdowns requires a document runtime");
        expect(() => runtime.createAbortController()).toThrow(
            "ensureChartSettingsDropdowns requires an AbortController runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "ensureChartSettingsDropdowns requires an HTMLElement runtime"
        );
        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout runtime"
        );
    });
});
