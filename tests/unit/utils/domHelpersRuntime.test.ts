import { describe, expect, it } from "vitest";

import { getDomHelpersRuntime } from "../../../electron-app/utils/dom/domHelpersRuntime.js";

describe("getDomHelpersRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("dom-helpers-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getDomHelpersRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("creates abort controllers through provider functions", () => {
        expect.assertions(3);

        let providerCount = 0;
        let controllerCount = 0;
        const signal = Symbol("dom-helpers-provider-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getDomHelpersRuntime({
            getAbortController: () => {
                providerCount += 1;
                return TestAbortController;
            },
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(providerCount).toBe(1);
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getDomHelpersRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("dom helpers require an AbortController runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(1);

        const signal = Symbol("legacy-dom-helpers-signal");
        class LegacyAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getDomHelpersRuntime({
            AbortController: LegacyAbortController,
        } as unknown as Parameters<typeof getDomHelpersRuntime>[0]);

        expect(() => {
            runtime.createAbortController();
        }).toThrow("dom helpers require an AbortController runtime");
    });
});
