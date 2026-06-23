import { describe, expect, it, vi } from "vitest";

import { getMasterStateRuntime } from "../../../../../electron-app/utils/state/core/masterStateRuntime.js";

describe("masterStateRuntime", () => {
    it("detects development scopes from local renderer locations", () => {
        expect.assertions(4);

        expect(
            getMasterStateRuntime({
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                getLocation: () => ({
                    hostname: "127.0.0.1",
                    protocol: "http:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                getLocation: () => ({
                    hostname: "app-dev.local",
                    protocol: "https:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                getLocation: () => ({ hostname: "app", protocol: "file:" }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("detects development scopes from debug flags", () => {
        expect.assertions(5);

        const rendererScope = {
            getEventTarget: () => ({ addEventListener: vi.fn() }),
            getLocation: () => ({
                hostname: "example.com",
                protocol: "https:",
            }),
        };

        expect(
            getMasterStateRuntime({
                ...rendererScope,
                getLocation: () => ({
                    hostname: "example.com",
                    protocol: "https:",
                    search: "?debug=true",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                ...rendererScope,
                getLocation: () => ({
                    hash: "#debug",
                    hostname: "example.com",
                    protocol: "https:",
                }),
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                ...rendererScope,
                getDevelopmentFlag: () => true,
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime(rendererScope).isDevelopmentScope({
                hasDevelopmentModeAttribute: true,
            })
        ).toBe(true);
        expect(
            getMasterStateRuntime(rendererScope).isDevelopmentScope({
                electronDevMode: true,
            })
        ).toBe(true);
    });

    it("rejects production and non-renderer locations", () => {
        expect.assertions(3);

        expect(
            getMasterStateRuntime({
                getLocation: () => ({
                    hostname: "example.com",
                    protocol: "https:",
                }),
                getEventTarget: () => ({ addEventListener: vi.fn() }),
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getMasterStateRuntime({
                getEventTarget: () => undefined,
                getLocation: () => ({
                    hostname: "localhost",
                    protocol: "http:",
                }),
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getMasterStateRuntime({ getDevelopmentFlag: () => false }).location
        ).toStrictEqual({});
    });

    it("routes document, global, and window events through scoped targets", () => {
        expect.assertions(5);

        const addDocumentEventListener = vi.fn();
        const addGlobalEventListener = vi.fn();
        const addWindowEventListener = vi.fn();
        const dispatchGlobalEvent = vi.fn(() => true);
        const runtime = getMasterStateRuntime({
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
        const runtime = getMasterStateRuntime({
            getDocumentQueryScope: () => queryScope,
        });

        expect(Array.from(runtime.getLoadingSensitiveElements())).toStrictEqual(
            [loadingElement]
        );
        expect(queryScope.querySelectorAll).toHaveBeenCalledExactlyOnceWith(
            ".loading-sensitive"
        );
        expect(queryScope.querySelectorAll.mock.contexts[0]).toBe(queryScope);
        expect(getMasterStateRuntime({}).getLoadingSensitiveElements()).toEqual(
            []
        );
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
        const runtime = getMasterStateRuntime({
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
        expect.assertions(21);

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
            () => TestAbortController as unknown as typeof AbortController
        );
        const getAddEventListener = vi.fn(() => addGlobalEventListener);
        const getDevelopmentFlag = vi.fn(() => false);
        const getDocumentEventTarget = vi.fn(() => documentEventTarget);
        const getDispatchEvent = vi.fn(() => dispatchGlobalEvent);
        const getLocation = vi.fn(() => location);
        const getEventTarget = vi.fn(() => eventTarget);
        const utils = getMasterStateRuntime({
            getAbortController,
            getAddEventListener,
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

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getDevelopmentFlag).toHaveBeenCalledOnce();
        expect(getDocumentEventTarget).toHaveBeenCalledOnce();
        expect(getDispatchEvent).toHaveBeenCalledOnce();
        expect(getLocation).toHaveBeenCalledTimes(2);
        expect(getEventTarget).toHaveBeenCalledTimes(4);
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
        expect(created).toBe(true);
        expect(listener).not.toHaveBeenCalled();
    });

    it("fails clearly when document event target runtime is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getMasterStateRuntime({}).addDocumentEventListener(
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
        const runtime = getMasterStateRuntime({
            getAbortController: () =>
                TestAbortController as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(created).toBe(true);
    });

    it("ignores legacy direct browser and development runtime properties", () => {
        expect.assertions(17);

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
        const removeBodyClass = vi.fn();
        const runtime = getMasterStateRuntime({
            __DEVELOPMENT__: true,
            AbortController:
                TestAbortController as unknown as typeof AbortController,
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
            location: { hostname: "localhost", protocol: "file:" },
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
        runtime.addGlobalEventListener("error", listener);
        runtime.addWindowEventListener("resize", listener);
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
        expect(created).toBe(false);
        expect(addGlobalEventListener).not.toHaveBeenCalled();
        expect(addWindowEventListener).not.toHaveBeenCalled();
        expect(addDocumentEventListener).not.toHaveBeenCalled();
        expect(dispatchGlobalEvent).not.toHaveBeenCalled();
        expect(querySelectorAll).not.toHaveBeenCalled();
        expect(addBodyClass).not.toHaveBeenCalled();
        expect(removeBodyClass).not.toHaveBeenCalled();
    });

    it("throws when abort controllers are unavailable", () => {
        expect.assertions(1);

        expect(() => getMasterStateRuntime({}).createAbortController()).toThrow(
            "master state manager requires an AbortController runtime"
        );
    });
});
