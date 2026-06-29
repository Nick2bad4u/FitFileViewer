import { describe, expect, it, vi } from "vitest";

import {
    getMasterStateRuntime,
    type MasterStateRuntimeScope,
} from "../../../../../electron-app/utils/state/core/masterStateRuntime.js";
import type {
    BrowserAbortControllerConstructor,
    BrowserClearInterval,
    BrowserCustomEventConstructor,
    BrowserSetInterval,
} from "../../../../../electron-app/utils/runtime/browserRuntime.js";

function createMasterStateRuntimeScope(
    overrides: Partial<MasterStateRuntimeScope> = {}
): MasterStateRuntimeScope {
    return {
        getAbortController: () => undefined,
        getAddEventListener: () => undefined,
        getClearInterval: () => undefined,
        getCustomEvent: () => undefined,
        getDateNow: () => undefined,
        getDevelopmentFlag: () => undefined,
        getDocument: () => undefined,
        getDocumentBody: () => undefined,
        getDocumentElement: () => undefined,
        getDocumentEventTarget: () => undefined,
        getDocumentQueryScope: () => undefined,
        getDispatchEvent: () => undefined,
        getEventTarget: () => undefined,
        getLocation: () => undefined,
        getPerformanceMemory: () => undefined,
        getSetInterval: () => undefined,
        ...overrides,
    };
}

function getScopedMasterStateRuntime(
    overrides: Partial<MasterStateRuntimeScope> = {}
): ReturnType<typeof getMasterStateRuntime> {
    return getMasterStateRuntime(createMasterStateRuntimeScope(overrides));
}

describe("masterStateRuntime", () => {
    it("reads timestamps through the injected provider", () => {
        expect.assertions(2);

        const dateNow = vi.fn<() => number>(() => 1234);
        const utils = getScopedMasterStateRuntime({
            getDateNow: () => dateNow,
        });

        expect(utils.dateNow()).toBe(1234);
        expect(dateNow).toHaveBeenCalledOnce();
    });

    it("routes performance monitor timers and memory through scoped providers", () => {
        expect.assertions(8);

        const intervalHandle = 456;
        const clearInterval = vi.fn<(handle: typeof intervalHandle) => void>();
        const setInterval = vi.fn<
            (callback: () => void, delayMs: number) => typeof intervalHandle
        >(() => intervalHandle);
        const performanceMemory = {
            totalJSHeapSize: 2048,
            usedJSHeapSize: 1024,
        };
        const getClearInterval = vi.fn(
            () => clearInterval as unknown as BrowserClearInterval
        );
        const getPerformanceMemory = vi.fn(() => performanceMemory);
        const getSetInterval = vi.fn(
            () => setInterval as unknown as BrowserSetInterval
        );
        const callback = vi.fn();
        const runtime = getScopedMasterStateRuntime({
            getClearInterval,
            getPerformanceMemory,
            getSetInterval,
        });

        expect(runtime.getPerformanceMemory()).toBe(performanceMemory);
        expect(runtime.setInterval(callback, 60_000)).toBe(intervalHandle);
        runtime.clearInterval(intervalHandle);

        expect(setInterval).toHaveBeenCalledExactlyOnceWith(callback, 60_000);
        expect(clearInterval).toHaveBeenCalledExactlyOnceWith(intervalHandle);
        expect(getPerformanceMemory).toHaveBeenCalledOnce();
        expect(getSetInterval).toHaveBeenCalledOnce();
        expect(getClearInterval).toHaveBeenCalledOnce();
        expect(callback).not.toHaveBeenCalled();
    });

    it("detects development scopes from local renderer locations", () => {
        expect.assertions(4);

        expect(
            getScopedMasterStateRuntime({
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime({
                getLocation: () => ({
                    hostname: "127.0.0.1",
                    protocol: "http:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime({
                getLocation: () => ({
                    hostname: "app-dev.local",
                    protocol: "https:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime({
                getLocation: () => ({ hostname: "app", protocol: "file:" }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("detects development scopes from debug flags", () => {
        expect.assertions(4);

        const rendererScope = {
            getEventTarget: () => ({ addEventListener: vi.fn() }),
            getLocation: () => ({
                hostname: "example.com",
                protocol: "https:",
            }),
        };

        expect(
            getScopedMasterStateRuntime({
                ...rendererScope,
                getLocation: () => ({
                    hostname: "example.com",
                    protocol: "https:",
                    search: "?debug=true",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime({
                ...rendererScope,
                getLocation: () => ({
                    hash: "#debug",
                    hostname: "example.com",
                    protocol: "https:",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime({
                ...rendererScope,
                getDevelopmentFlag: () => true,
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getScopedMasterStateRuntime(rendererScope).isDevelopmentScope({
                hasDevelopmentModeAttribute: true,
            })
        ).toBe(true);
    });

    it("rejects production and non-renderer locations", () => {
        expect.assertions(3);

        expect(
            getScopedMasterStateRuntime({
                getLocation: () => ({
                    hostname: "example.com",
                    protocol: "https:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getScopedMasterStateRuntime({
                getEventTarget: () => undefined,
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getScopedMasterStateRuntime({ getDevelopmentFlag: () => false })
                .location
        ).toStrictEqual({});
    });

    it("routes document, global, and window events through scoped targets", () => {
        expect.assertions(5);

        const addDocumentEventListener = vi.fn();
        const addGlobalEventListener = vi.fn();
        const addWindowEventListener = vi.fn();
        const dispatchGlobalEvent = vi.fn(() => true);
        const runtime = getScopedMasterStateRuntime({
            getAddEventListener: () => addGlobalEventListener,
            getDocumentEventTarget: () => ({
                addEventListener: addDocumentEventListener,
            }),
            getDispatchEvent: () => dispatchGlobalEvent,
            getEventTarget: () => ({
                addEventListener: addWindowEventListener,
            }),
        });
        const listener = vi.fn();
        const options = { once: true };
        const event = new Event("themeChanged");

        runtime.addDocumentEventListener("keydown", listener, options);
        runtime.addGlobalEventListener("error", listener, options);
        runtime.addWindowEventListener("resize", listener, options);

        expect(runtime.dispatchGlobalEvent(event)).toBe(true);
        expect(addDocumentEventListener).toHaveBeenCalledWith(
            "keydown",
            listener,
            options
        );
        expect(addGlobalEventListener).toHaveBeenCalledWith(
            "error",
            listener,
            options
        );
        expect(addWindowEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(dispatchGlobalEvent).toHaveBeenCalledWith(event);
    });

    it("routes loading-sensitive element lookups through scoped query providers", () => {
        expect.assertions(4);

        const loadingElement = document.createElement("button");
        const queryScope = {
            querySelectorAll: vi.fn<Document["querySelectorAll"]>((selector) =>
                selector === ".loading-sensitive"
                    ? ([loadingElement] as unknown as NodeListOf<Element>)
                    : ([] as unknown as NodeListOf<Element>)
            ),
        };
        const runtime = getScopedMasterStateRuntime({
            getDocumentQueryScope: () => queryScope,
        });

        expect(Array.from(runtime.getLoadingSensitiveElements())).toStrictEqual(
            [loadingElement]
        );
        expect(queryScope.querySelectorAll).toHaveBeenCalledExactlyOnceWith(
            ".loading-sensitive"
        );
        expect(queryScope.querySelectorAll.mock.contexts[0]).toBe(queryScope);
        expect(
            getScopedMasterStateRuntime({}).getLoadingSensitiveElements()
        ).toEqual([]);
    });

    it("derives default document operations from a scoped document provider", () => {
        expect.assertions(7);

        const scopedDocument =
            document.implementation.createHTMLDocument("Scoped State");
        scopedDocument.documentElement.dataset["devMode"] = "true";
        scopedDocument.body.innerHTML = `
            <button id="loading-button" class="loading-sensitive"></button>
        `;
        const addDocumentEventListener = vi.spyOn(
            scopedDocument,
            "addEventListener"
        );
        const runtime = getScopedMasterStateRuntime({
            getDocument: () => scopedDocument,
        });
        const listener = vi.fn();
        const options = { once: true };

        runtime.addDocumentEventListener("keydown", listener, options);
        runtime.addBodyClass("drag-over");
        expect(scopedDocument.body.classList.contains("drag-over")).toBe(true);
        runtime.removeBodyClass("drag-over");

        const loadingElements = Array.from(
            runtime.getLoadingSensitiveElements()
        );

        expect(scopedDocument.body.classList.contains("drag-over")).toBe(false);
        expect(runtime.hasDevelopmentModeAttribute()).toBe(true);
        expect(loadingElements).toHaveLength(1);
        expect(loadingElements[0]?.id).toBe("loading-button");
        expect(addDocumentEventListener).toHaveBeenCalledWith(
            "keydown",
            listener,
            options
        );
        expect(addDocumentEventListener.mock.contexts[0]).toBe(scopedDocument);
    });

    it("routes body class and development attribute reads through scoped providers", () => {
        expect.assertions(6);

        const add = vi.fn();
        const remove = vi.fn();
        const documentBody = {
            classList: { add, remove },
        };
        const documentElement = {
            dataset: { devMode: "true" } as DOMStringMap,
            hasAttribute: vi.fn(() => true),
        };
        const getDocumentBody = vi.fn(() => documentBody);
        const getDocumentElement = vi.fn(() => documentElement);
        const runtime = getScopedMasterStateRuntime({
            getDocumentBody,
            getDocumentElement,
        });

        runtime.addBodyClass("drag-over");
        runtime.removeBodyClass("drag-over");

        expect(runtime.hasDevelopmentModeAttribute()).toBe(true);
        expect(add).toHaveBeenCalledExactlyOnceWith("drag-over");
        expect(remove).toHaveBeenCalledExactlyOnceWith("drag-over");
        expect(getDocumentBody).toHaveBeenCalledTimes(2);
        expect(getDocumentElement).toHaveBeenCalledOnce();
        expect(documentElement.hasAttribute).not.toHaveBeenCalled();
    });

    it("routes browser state dependencies through provider functions", () => {
        expect.assertions(25);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
        const addDocumentEventListener = vi.fn();
        const addGlobalEventListener = vi.fn();
        const addWindowEventListener = vi.fn();
        const dispatchGlobalEvent = vi.fn(() => true);
        const listener = vi.fn();
        const options = { once: true };
        const event = new Event("stateChanged");
        const location = {
            hostname: "example.com",
            protocol: "https:",
            search: "?debug=true",
        };
        const documentEventTarget = {
            addEventListener: addDocumentEventListener,
        };
        const eventTarget = { addEventListener: addWindowEventListener };
        const getAbortController = vi.fn(
            () =>
                TestAbortController as unknown as BrowserAbortControllerConstructor
        );
        const getAddEventListener = vi.fn(() => addGlobalEventListener);
        class TestCustomEvent<T = unknown> extends CustomEvent<T> {
            public constructor(type: string, init?: CustomEventInit<T>) {
                super(`test:${type}`, init);
            }
        }
        const getCustomEvent = vi.fn(() => TestCustomEvent);
        const getDevelopmentFlag = vi.fn(() => false);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const getDispatchEvent = vi.fn(() => dispatchGlobalEvent);
        const getLocation = vi.fn(() => location);
        const getEventTarget = vi.fn(() => eventTarget);
        const utils = getScopedMasterStateRuntime({
            getAbortController,
            getAddEventListener,
            getCustomEvent,
            getDevelopmentFlag,
            getDocumentEventTarget,
            getDispatchEvent,
            getEventTarget,
            getLocation,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(utils.location).toBe(location);
        expect(utils.isDevelopmentScope()).toBe(true);
        utils.addDocumentEventListener("keydown", listener, options);
        utils.addGlobalEventListener("error", listener, options);
        utils.addWindowEventListener("resize", listener, options);
        expect(utils.dispatchGlobalEvent(event)).toBe(true);
        const themeChangedEvent = utils.createThemeChangedEvent("dark");

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getCustomEvent).toHaveBeenCalledOnce();
        expect(getDevelopmentFlag).toHaveBeenCalledOnce();
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getDispatchEvent).toHaveBeenCalledOnce();
        expect(getLocation).toHaveBeenCalledTimes(2);
        expect(getEventTarget).toHaveBeenCalledTimes(3);
        expect(addDocumentEventListener).toHaveBeenCalledWith(
            "keydown",
            listener,
            options
        );
        expect(addGlobalEventListener).toHaveBeenCalledWith(
            "error",
            listener,
            options
        );
        expect(addWindowEventListener).toHaveBeenCalledWith(
            "resize",
            listener,
            options
        );
        expect(dispatchGlobalEvent).toHaveBeenCalledWith(event);
        expect(addDocumentEventListener.mock.contexts[0]).toBe(
            documentEventTarget
        );
        expect(addGlobalEventListener.mock.contexts[0]).toMatchObject({
            getAddEventListener,
        });
        expect(addWindowEventListener.mock.contexts[0]).toBe(eventTarget);
        expect(dispatchGlobalEvent.mock.contexts[0]).toMatchObject({
            getDispatchEvent,
        });
        expect(themeChangedEvent).toBeInstanceOf(TestCustomEvent);
        expect(themeChangedEvent.type).toBe("test:themeChanged");
        expect(themeChangedEvent.detail).toStrictEqual({ theme: "dark" });
        expect(created).toBe(true);
        expect(listener).not.toHaveBeenCalled();
    });

    it("creates themeChanged events through the scoped CustomEvent runtime", () => {
        expect.assertions(4);

        class TestCustomEvent<T = unknown> extends CustomEvent<T> {
            public constructor(type: string, init?: CustomEventInit<T>) {
                super(`test:${type}`, init);
            }
        }
        const runtime = getScopedMasterStateRuntime({
            getCustomEvent: () => TestCustomEvent,
        });
        const event = runtime.createThemeChangedEvent("system");

        expect(event).toBeInstanceOf(TestCustomEvent);
        expect(event.type).toBe("test:themeChanged");
        expect(event.detail).toStrictEqual({ theme: "system" });
        expect(event.bubbles).toBe(false);
    });

    it("throws when themeChanged event creation is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getScopedMasterStateRuntime({}).createThemeChangedEvent("dark")
        ).toThrow("master state manager requires a CustomEvent runtime");
    });

    it("fails clearly when document event target runtime is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getScopedMasterStateRuntime({}).addDocumentEventListener(
                "keydown",
                vi.fn()
            )
        ).toThrow(
            "master state manager requires a document event-target runtime"
        );
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
        const runtime = getScopedMasterStateRuntime({
            getAbortController: () =>
                TestAbortController as unknown as BrowserAbortControllerConstructor,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("uses browser runtime providers for production browser defaults", () => {
        expect.assertions(13);

        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-25T20:00:00.000Z"));
        try {
            const runtime = getMasterStateRuntime();
            const globalListener = vi.fn();
            const windowListener = vi.fn();
            const intervalCallback = vi.fn();

            expect(runtime.createAbortController()).toBeInstanceOf(
                AbortController
            );
            expect(runtime.createThemeChangedEvent("dark")).toBeInstanceOf(
                CustomEvent
            );
            expect(runtime.dateNow()).toBe(
                new Date("2026-06-25T20:00:00.000Z").getTime()
            );
            expect(runtime.location.href).toBe(globalThis.location.href);

            runtime.addGlobalEventListener("resize", globalListener, {
                once: true,
            });
            runtime.addWindowEventListener("focus", windowListener, {
                once: true,
            });
            runtime.addBodyClass("drag-over");
            const intervalHandle = runtime.setInterval(intervalCallback, 100);

            expect(document.body.classList.contains("drag-over")).toBe(true);
            expect(runtime.hasDevelopmentModeAttribute()).toBe(false);
            expect(runtime.dispatchGlobalEvent(new Event("resize"))).toBe(true);
            globalThis.dispatchEvent(new Event("focus"));
            expect(globalListener).toHaveBeenCalledOnce();
            expect(windowListener).toHaveBeenCalledOnce();
            expect(intervalCallback).not.toHaveBeenCalled();
            vi.advanceTimersByTime(100);
            expect(intervalCallback).toHaveBeenCalledOnce();
            runtime.clearInterval(intervalHandle);
            vi.advanceTimersByTime(100);
            expect(intervalCallback).toHaveBeenCalledOnce();

            runtime.removeBodyClass("drag-over");

            expect(document.body.classList.contains("drag-over")).toBe(false);
        } finally {
            vi.useRealTimers();
        }
    });

    it("ignores legacy direct browser, clock, and development runtime properties", () => {
        expect.assertions(26);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
        const addDocumentEventListener = vi.fn();
        const addGlobalEventListener = vi.fn();
        const addWindowEventListener = vi.fn();
        const dispatchGlobalEvent = vi.fn(() => true);
        const querySelectorAll = vi.fn<Document["querySelectorAll"]>(
            () =>
                [
                    document.createElement("button"),
                ] as unknown as NodeListOf<Element>
        );
        const addBodyClass = vi.fn();
        const clearInterval = vi.fn();
        const CustomEventConstructor = vi.fn(function FakeCustomEvent() {
            return new CustomEvent("legacy");
        });
        const dateNow = vi.fn<() => number>(() => 1234);
        const removeBodyClass = vi.fn();
        const setInterval = vi.fn();
        const runtime = getMasterStateRuntime({
            ...createMasterStateRuntimeScope(),
            __DEVELOPMENT__: true,
            AbortController:
                TestAbortController as unknown as BrowserAbortControllerConstructor,
            CustomEvent:
                CustomEventConstructor as unknown as BrowserCustomEventConstructor,
            addEventListener: addGlobalEventListener,
            documentBody: {
                classList: {
                    add: addBodyClass,
                    remove: removeBodyClass,
                },
            },
            documentElement: {
                dataset: { devMode: "true" },
                hasAttribute: vi.fn(() => true),
            },
            documentEventTarget: { addEventListener: addDocumentEventListener },
            documentQueryScope: { querySelectorAll },
            dispatchEvent: dispatchGlobalEvent,
            eventTarget: { addEventListener: addWindowEventListener },
            clearInterval,
            dateNow,
            location: { hostname: "localhost", protocol: "file:" },
            performanceMemory: {
                totalJSHeapSize: 2048,
                usedJSHeapSize: 1024,
            },
            setInterval,
        } as unknown as Parameters<typeof getMasterStateRuntime>[0]);
        const listener = vi.fn();
        const event = new Event("stateChanged");

        expect(runtime.isDevelopmentScope()).toBe(false);
        expect(runtime.location).toStrictEqual({});
        expect(runtime.dispatchGlobalEvent(event)).toBe(false);
        expect(runtime.hasDevelopmentModeAttribute()).toBe(false);
        expect(Array.from(runtime.getLoadingSensitiveElements())).toStrictEqual(
            []
        );
        expect(runtime.getPerformanceMemory()).toBeUndefined();
        runtime.addGlobalEventListener("error", listener);
        runtime.addWindowEventListener("resize", listener);
        expect(() => runtime.clearInterval(123)).toThrow(
            "master state manager requires clearInterval runtime"
        );
        expect(() => runtime.setInterval(listener, 60_000)).toThrow(
            "master state manager requires setInterval runtime"
        );
        expect(() => runtime.addBodyClass("drag-over")).toThrow(
            "master state manager requires a document body runtime"
        );
        expect(() => runtime.removeBodyClass("drag-over")).toThrow(
            "master state manager requires a document body runtime"
        );
        expect(() =>
            runtime.addDocumentEventListener("keydown", listener)
        ).toThrow(
            "master state manager requires a document event-target runtime"
        );
        expect(() => runtime.createAbortController()).toThrow(
            "master state manager requires an AbortController runtime"
        );
        expect(() => runtime.createThemeChangedEvent("dark")).toThrow(
            "master state manager requires a CustomEvent runtime"
        );
        expect(() => runtime.dateNow()).toThrow(
            "master state manager requires dateNow"
        );
        expect(created).toBe(false);
        expect(CustomEventConstructor).not.toHaveBeenCalled();
        expect(dateNow).not.toHaveBeenCalled();
        expect(addGlobalEventListener).not.toHaveBeenCalled();
        expect(addWindowEventListener).not.toHaveBeenCalled();
        expect(addDocumentEventListener).not.toHaveBeenCalled();
        expect(dispatchGlobalEvent).not.toHaveBeenCalled();
        expect(querySelectorAll).not.toHaveBeenCalled();
        expect(addBodyClass).not.toHaveBeenCalled();
        expect(clearInterval).not.toHaveBeenCalled();
        expect(removeBodyClass).not.toHaveBeenCalled();
        expect(setInterval).not.toHaveBeenCalled();
    });

    it("throws when abort controllers are unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getScopedMasterStateRuntime({}).createAbortController()
        ).toThrow("master state manager requires an AbortController runtime");
    });

    it("throws when date clocks are unavailable", () => {
        expect.assertions(1);

        expect(() => getScopedMasterStateRuntime({}).dateNow()).toThrow(
            "master state manager requires dateNow"
        );
    });

    it("throws when interval primitives are unavailable", () => {
        expect.assertions(2);

        expect(() =>
            getScopedMasterStateRuntime({}).clearInterval(123)
        ).toThrow("master state manager requires clearInterval runtime");
        expect(() =>
            getScopedMasterStateRuntime({}).setInterval(vi.fn(), 1)
        ).toThrow("master state manager requires setInterval runtime");
    });

    it("throws when required master state runtime providers are omitted", () => {
        expect.assertions(16);

        const scope = createMasterStateRuntimeScope();

        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getAbortController: undefined,
            }).createAbortController()
        ).toThrow("master state manager requires AbortController provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getAddEventListener: undefined,
            }).addGlobalEventListener("error", vi.fn())
        ).toThrow("master state manager requires addEventListener provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getClearInterval: undefined,
            }).clearInterval(1)
        ).toThrow("master state manager requires clearInterval provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getCustomEvent: undefined,
            }).createThemeChangedEvent("dark")
        ).toThrow("master state manager requires CustomEvent provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDateNow: undefined,
            }).dateNow()
        ).toThrow("master state manager requires dateNow provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDevelopmentFlag: undefined,
            }).isDevelopmentScope()
        ).toThrow("master state manager requires developmentFlag provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDocument: undefined,
            }).getLoadingSensitiveElements()
        ).toThrow("master state manager requires document provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDocumentBody: undefined,
            }).addBodyClass("drag-over")
        ).toThrow("master state manager requires documentBody provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDocumentElement: undefined,
            }).hasDevelopmentModeAttribute()
        ).toThrow("master state manager requires documentElement provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDocumentEventTarget: undefined,
            }).addDocumentEventListener("keydown", vi.fn())
        ).toThrow("master state manager requires documentEventTarget provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDocumentQueryScope: undefined,
            }).getLoadingSensitiveElements()
        ).toThrow("master state manager requires documentQueryScope provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getDispatchEvent: undefined,
            }).dispatchGlobalEvent(new Event("stateChanged"))
        ).toThrow("master state manager requires dispatchEvent provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getEventTarget: undefined,
            }).addWindowEventListener("resize", vi.fn())
        ).toThrow("master state manager requires eventTarget provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getEventTarget: () => ({ addEventListener: vi.fn() }),
                getLocation: undefined,
            }).isDevelopmentScope()
        ).toThrow("master state manager requires location provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getPerformanceMemory: undefined,
            }).getPerformanceMemory()
        ).toThrow("master state manager requires performanceMemory provider");
        expect(() =>
            getMasterStateRuntime({
                ...scope,
                getSetInterval: undefined,
            }).setInterval(vi.fn(), 1)
        ).toThrow("master state manager requires setInterval provider");
    });
});
