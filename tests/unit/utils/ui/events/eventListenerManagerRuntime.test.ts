import { describe, expect, it } from "vitest";

import { getEventListenerManagerRuntime } from "../../../../../electron-app/utils/ui/events/eventListenerManagerRuntime.js";

describe("getEventListenerManagerRuntime", () => {
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
            AbortController: TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
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
});
