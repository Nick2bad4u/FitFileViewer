import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../electron-app/utils/runtime/browserRuntime.js";
import { getEventListenerManagerRuntime } from "../../../../../electron-app/utils/ui/events/eventListenerManagerRuntime.js";

describe("getEventListenerManagerRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getEventListenerManagerRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production event-target defaults", () => {
        expect.assertions(1);

        const addEventListener = vi.fn();
        vi.stubGlobal("addEventListener", addEventListener);

        expect(
            getEventListenerManagerRuntime().getDefaultDragDropTarget()
        ).toBe(globalThis);
    });

    it("resolves the default event target through the injected event-target scope", () => {
        expect.assertions(1);

        const target = new EventTarget(),
            runtime = getEventListenerManagerRuntime({
                getEventTarget: () => target,
            });

        expect(runtime.getDefaultDragDropTarget()).toBe(target);
    });

    it("returns undefined when no default event target is available", () => {
        expect.assertions(1);

        expect(
            getEventListenerManagerRuntime({}).getDefaultDragDropTarget()
        ).toBeUndefined();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("event-listener-manager-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getEventListenerManagerRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(4);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const target = new EventTarget();
        const getAbortController = () =>
            TestAbortController as unknown as BrowserAbortControllerConstructor;
        const getEventTarget = () => target;

        const runtime = getEventListenerManagerRuntime({
            getAbortController,
            getEventTarget,
        });

        expect(runtime.getDefaultDragDropTarget()).toBe(target);
        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        expect(
            getEventListenerManagerRuntime({}).getDefaultDragDropTarget()
        ).toBeUndefined();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getEventListenerManagerRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "event listener manager requires an AbortController runtime"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const signal = Symbol("legacy-event-listener-manager-signal");
        class LegacyAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const target = new EventTarget();
        const runtime = getEventListenerManagerRuntime({
            AbortController: LegacyAbortController,
            eventTarget: target,
        } as unknown as Parameters<typeof getEventListenerManagerRuntime>[0]);

        expect(runtime.getDefaultDragDropTarget()).toBeUndefined();
        expect(() => {
            runtime.createAbortController();
        }).toThrow(
            "event listener manager requires an AbortController runtime"
        );
    });
});
