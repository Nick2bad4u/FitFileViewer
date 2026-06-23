import { describe, expect, it, vi } from "vitest";

import {
    getLifecycleListenersRuntime,
    type LifecycleListenersRuntimeScope,
} from "../../../../../electron-app/utils/app/lifecycle/listenersRuntime.js";

describe("getLifecycleListenersRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getLifecycleListenersRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("throws when abort controller creation is unavailable", () => {
        expect.assertions(1);

        const runtime = getLifecycleListenersRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "lifecycle listeners require an AbortController runtime"
        );
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = () => undefined;
        const delayMs = Number("100");
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        let scheduledCallback: unknown;
        let scheduledDelay: unknown;
        let clearedTimer: unknown;
        const setTimeout = ((handler: TimerHandler, timeout?: number) => {
            scheduledCallback = handler;
            scheduledDelay = timeout;
            return timer;
        }) as typeof globalThis.setTimeout;
        const clearTimeout: typeof globalThis.clearTimeout = (handle) => {
            clearedTimer = handle;
        };
        const runtime = getLifecycleListenersRuntime({
            getClearTimeout: () => clearTimeout,
            getSetTimeout: () => setTimeout,
        });

        expect(runtime.setTimeout(callback, delayMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect({ scheduledCallback, scheduledDelay }).toStrictEqual({
            scheduledCallback: callback,
            scheduledDelay: delayMs,
        });
        expect(clearedTimer).toBe(timer);
    });

    it("routes print and test-environment checks through the injected runtime scope", () => {
        expect.assertions(2);

        const print = vi.fn<() => void>();
        const runtime = getLifecycleListenersRuntime({
            getPrint: () => print,
            getProcess: () => ({
                env: {
                    NODE_ENV: "test",
                },
            }),
        });

        runtime.print();

        expect(print).toHaveBeenCalledOnce();
        expect(runtime.isTestEnvironment()).toBe(true);
    });

    it("routes download DOM and URL helpers through injected runtime providers", () => {
        expect.assertions(8);

        const anchor = document.createElement("a");
        const append = vi.spyOn(document.body, "append");
        const createElement = vi.fn<typeof document.createElement>(
            () => anchor
        );
        const blobUrl = "blob:lifecycle-listeners-test";
        const createObjectURL = vi.fn<(blob: Blob) => string>(() => blobUrl);
        const revokeObjectURL = vi.fn<(url: string) => void>();
        const runtime = getLifecycleListenersRuntime({
            getDocument: () => ({
                body: document.body,
                createElement,
            }),
            getURL: () => ({
                createObjectURL,
                revokeObjectURL,
            }),
        });
        const blob = new Blob(["test"]);

        expect(runtime.createDownloadAnchor()).toBe(anchor);
        runtime.appendToBody(anchor);
        expect(runtime.createObjectURL(blob)).toBe(blobUrl);
        runtime.revokeObjectURL(blobUrl);

        expect(createElement).toHaveBeenCalledWith("a");
        expect(append).toHaveBeenCalledWith(anchor);
        expect(createObjectURL).toHaveBeenCalledWith(blob);
        expect(revokeObjectURL).toHaveBeenCalledWith(blobUrl);
        expect(anchor.parentElement).toBe(document.body);
        expect(anchor.tagName).toBe("A");

        anchor.remove();
        append.mockRestore();
    });

    it("throws when print is unavailable", () => {
        expect.assertions(1);

        const runtime = getLifecycleListenersRuntime({});

        expect(() => runtime.print()).toThrow(
            "lifecycle listeners require a print runtime"
        );
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(6);

        const runtime = getLifecycleListenersRuntime({});

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "lifecycle listeners require a setTimeout runtime"
        );
        expect(() => {
            runtime.clearTimeout(
                23 as ReturnType<typeof globalThis.setTimeout>
            );
        }).toThrow("lifecycle listeners require a clearTimeout runtime");
        expect(() => runtime.createDownloadAnchor()).toThrow(
            "lifecycle listeners require a document runtime"
        );
        expect(() => runtime.appendToBody(document.createElement("a"))).toThrow(
            "lifecycle listeners require a document runtime"
        );
        expect(() => runtime.createObjectURL(new Blob(["test"]))).toThrow(
            "lifecycle listeners require a URL runtime"
        );
        expect(() => runtime.revokeObjectURL("blob:test")).toThrow(
            "lifecycle listeners require a URL runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(9);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const print = vi.fn<() => void>();
        const timer = 23 as ReturnType<typeof globalThis.setTimeout>;
        const legacyScope = {
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            clearTimeout: vi.fn<typeof globalThis.clearTimeout>(),
            print,
            process: {
                env: {
                    NODE_ENV: "test",
                },
            },
            setTimeout: vi.fn<typeof globalThis.setTimeout>(() => timer),
            URL: {
                createObjectURL: vi.fn<(blob: Blob) => string>(
                    () => "blob:legacy"
                ),
                revokeObjectURL: vi.fn<(url: string) => void>(),
            },
            document,
        } as unknown as LifecycleListenersRuntimeScope;
        const runtime = getLifecycleListenersRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "lifecycle listeners require an AbortController runtime"
        );
        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "lifecycle listeners require a setTimeout runtime"
        );
        expect(() => runtime.print()).toThrow(
            "lifecycle listeners require a print runtime"
        );
        expect(() => runtime.createDownloadAnchor()).toThrow(
            "lifecycle listeners require a document runtime"
        );
        expect(() => runtime.appendToBody(document.createElement("a"))).toThrow(
            "lifecycle listeners require a document runtime"
        );
        expect(() => runtime.createObjectURL(new Blob(["test"]))).toThrow(
            "lifecycle listeners require a URL runtime"
        );
        expect(() => runtime.revokeObjectURL("blob:legacy")).toThrow(
            "lifecycle listeners require a URL runtime"
        );
        expect(runtime.isTestEnvironment()).toBe(false);
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
    });
});
