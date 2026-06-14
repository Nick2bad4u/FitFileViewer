import { describe, expect, it, vi } from "vitest";

import { getMasterStateRuntime } from "../../../../../electron-app/utils/state/core/masterStateRuntime.js";

describe("masterStateRuntime", () => {
    it("detects development scopes from local renderer locations", () => {
        expect.assertions(4);

        expect(
            getMasterStateRuntime({
                location: { hostname: "localhost", protocol: "http:" },
                window: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "127.0.0.1", protocol: "http:" },
                window: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "app-dev.local", protocol: "https:" },
                window: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
        expect(
            getMasterStateRuntime({
                location: { hostname: "app", protocol: "file:" },
                window: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(true);
    });

    it("detects development scopes from debug flags", () => {
        expect.assertions(5);

        const rendererScope = {
            location: { hostname: "example.com", protocol: "https:" },
            window: { addEventListener: vi.fn() },
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
                window: { addEventListener: vi.fn() },
            }).isDevelopmentScope()
        ).toBe(false);
        expect(
            getMasterStateRuntime({
                location: { hostname: "localhost", protocol: "http:" },
                window: undefined,
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
            window: { addEventListener: addWindowEventListener },
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
