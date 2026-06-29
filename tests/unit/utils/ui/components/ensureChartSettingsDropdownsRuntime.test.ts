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

function createEnsureChartSettingsDropdownsRuntimeScope(
    overrides: Partial<EnsureChartSettingsDropdownsRuntimeScope> = {}
): EnsureChartSettingsDropdownsRuntimeScope {
    return {
        getAbortController: () => AbortController,
        getDocument: () => document,
        getHTMLElement: () => HTMLElement,
        getSetTimeout: () => setTimeout,
        ...overrides,
    };
}

function createUnavailableEnsureChartSettingsDropdownsRuntimeScope(
    overrides: Partial<EnsureChartSettingsDropdownsRuntimeScope> = {}
): EnsureChartSettingsDropdownsRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getEnsureChartSettingsDropdownsRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates elements and exposes the injected document body", () => {
        expect.assertions(3);

        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getDocument: () => document,
            })
        );

        expect(runtime.document).toBe(document);
        expect(runtime.createElement("button")).toBeInstanceOf(
            HTMLButtonElement
        );
        expect(runtime.getBody()).toBe(document.body);
    });

    it("checks HTMLElement instances through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
            })
        );

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
        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getDocument: () => document,
                getSetTimeout: () => setTimeoutMock,
            })
        );
        const callback = vi.fn();

        const handle = runtime.setTimeout(callback, 0);

        expect(handle).toBe(7);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(setTimeoutMock).toHaveBeenCalledWith(callback, 0);
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(1);

        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getSetTimeout: undefined,
            })
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout provider"
        );
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getAbortController: () => AbortController,
                getDocument: () => document,
            })
        );
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

        const runtime = getEnsureChartSettingsDropdownsRuntime(
            createEnsureChartSettingsDropdownsRuntimeScope({
                getDocument: () =>
                    ({
                        createElement: document.createElement.bind(document),
                        body: document.body,
                    }) as Document,
                getHTMLElement: () =>
                    "HTMLElement" as unknown as BrowserHTMLElementConstructor,
            })
        );
        const runtimeWithoutAbortController =
            getEnsureChartSettingsDropdownsRuntime(
                createUnavailableEnsureChartSettingsDropdownsRuntimeScope({
                    getDocument: () =>
                        ({
                            body: document.body,
                            createElement:
                                document.createElement.bind(document),
                        }) as Document,
                })
            );
        const runtimeWithInvalidAbortController =
            getEnsureChartSettingsDropdownsRuntime(
                createEnsureChartSettingsDropdownsRuntimeScope({
                    getAbortController: () =>
                        "AbortController" as unknown as BrowserAbortControllerConstructor,
                    getDocument: () => document,
                })
            );

        expect(() =>
            getEnsureChartSettingsDropdownsRuntime(
                createUnavailableEnsureChartSettingsDropdownsRuntimeScope()
            )
        ).toThrow("ensureChartSettingsDropdowns requires a document runtime");
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
            getEnsureChartSettingsDropdownsRuntime(
                createEnsureChartSettingsDropdownsRuntimeScope({
                    getDocument: () => document,
                    getSetTimeout: () =>
                        "setTimeout" as unknown as BrowserSetTimeout,
                })
            ).setTimeout(() => {}, 0)
        ).toThrow("ensureChartSettingsDropdowns requires a setTimeout runtime");
    });

    it("fails clearly when provider slots are omitted", () => {
        expect.assertions(4);

        expect(() =>
            getEnsureChartSettingsDropdownsRuntime({
                getAbortController: () => AbortController,
                getDocument: undefined,
                getHTMLElement: () => HTMLElement,
                getSetTimeout: () => setTimeout,
            })
        ).toThrow("ensureChartSettingsDropdowns requires a document provider");
        expect(() =>
            getEnsureChartSettingsDropdownsRuntime({
                getAbortController: undefined,
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
                getSetTimeout: () => setTimeout,
            }).createAbortController()
        ).toThrow(
            "ensureChartSettingsDropdowns requires an AbortController provider"
        );
        expect(() =>
            getEnsureChartSettingsDropdownsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getHTMLElement: undefined,
                getSetTimeout: () => setTimeout,
            }).isHTMLElement(document.body)
        ).toThrow(
            "ensureChartSettingsDropdowns requires an HTMLElement provider"
        );
        expect(() =>
            getEnsureChartSettingsDropdownsRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
                getHTMLElement: () => HTMLElement,
                getSetTimeout: undefined,
            }).setTimeout(() => {}, 0)
        ).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout provider"
        );
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
        ).toThrow("ensureChartSettingsDropdowns requires a document provider");
        expect(() => runtime.createAbortController()).toThrow(
            "ensureChartSettingsDropdowns requires an AbortController provider"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "ensureChartSettingsDropdowns requires an HTMLElement provider"
        );
        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "ensureChartSettingsDropdowns requires a setTimeout provider"
        );
    });
});
