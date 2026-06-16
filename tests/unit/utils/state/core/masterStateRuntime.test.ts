import { describe, expect, it, vi } from "vitest";

import { getMasterStateRuntime } from "../../../../../electron-app/utils/state/core/masterStateRuntime.js";

describe("masterStateRuntime", () => {
    it("detects development scopes from local renderer locations", () => {
        expect.assertions(4);

        expect(
            getMasterStateRuntime({
                location: { hostname: "localhost", protocol: "http:" },
                eventTarget: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "127.0.0.1", protocol: "http:" },
                eventTarget: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "app-dev.local", protocol: "https:" },
                eventTarget: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "app", protocol: "file:" },
                eventTarget: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("detects development scopes from debug flags", () => {
        expect.assertions(5);

        const rendererScope = {
            eventTarget: { addEventListener: vi.fn() },
            location: { hostname: "example.com", protocol: "https:" },
        };

        expect(
            getMasterStateRuntime({
                ...rendererScope,
                location: { ...rendererScope.location, search: "?debug=true" },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                ...rendererScope,
                location: { ...rendererScope.location, hash: "#debug" },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                ...rendererScope,
                __DEVELOPMENT__: true,
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
                location: { hostname: "example.com", protocol: "https:" },
                eventTarget: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getMasterStateRuntime({
                eventTarget: undefined,
                location: { hostname: "localhost", protocol: "http:" },
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getMasterStateRuntime({ __DEVELOPMENT__: false }).location
        ).toStrictEqual({});
    });

    it("routes global and window events through scoped targets", () => {
        expect.assertions(4);

        const addGlobalEventListener = vi.fn();
        const addWindowEventListener = vi.fn();
        const dispatchGlobalEvent = vi.fn(() => true);
        const runtime = getMasterStateRuntime({
            addEventListener: addGlobalEventListener,
            dispatchEvent: dispatchGlobalEvent,
            eventTarget: { addEventListener: addWindowEventListener },
        });
        const listener = vi.fn();
        const options = { once: true };
        const event = new Event("themeChanged");

        runtime.addGlobalEventListener("error", listener, options);
        runtime.addWindowEventListener("resize", listener, options);

        expect(runtime.dispatchGlobalEvent(event)).toBe(true);
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

    it("routes browser state dependencies through provider functions", () => {
        expect.assertions(18);

        let created = false;
        class TestAbortController extends AbortController {
            constructor() {
                super();
                created = true;
            }
        }
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
        const eventTarget = { addEventListener: addWindowEventListener };
        const getAbortController = vi.fn(
            () => TestAbortController as unknown as typeof AbortController
        );
        const getAddEventListener = vi.fn(() => addGlobalEventListener);
        const getDevelopmentFlag = vi.fn(() => false);
        const getDispatchEvent = vi.fn(() => dispatchGlobalEvent);
        const getLocation = vi.fn(() => location);
        const getEventTarget = vi.fn(() => eventTarget);
        const utils = getMasterStateRuntime({
            getAbortController,
            getAddEventListener,
            getDevelopmentFlag,
            getDispatchEvent,
            getEventTarget,
            getLocation,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(utils.location).toBe(location);
        expect(utils.isDevelopmentScope()).toBe(true);
        utils.addGlobalEventListener("error", listener, options);
        utils.addWindowEventListener("resize", listener, options);
        expect(utils.dispatchGlobalEvent(event)).toBe(true);

        expect(getAbortController).toHaveBeenCalledOnce();
        expect(getAddEventListener).toHaveBeenCalledOnce();
        expect(getDevelopmentFlag).toHaveBeenCalledOnce();
        expect(getDispatchEvent).toHaveBeenCalledOnce();
        expect(getLocation).toHaveBeenCalledTimes(2);
        expect(getEventTarget).toHaveBeenCalledTimes(4);
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

        expect(() => getMasterStateRuntime({}).createAbortController()).toThrow(
            "master state manager requires an AbortController runtime"
        );
    });
});
