import { describe, expect, it } from "vitest";

import { getRendererTestOnlyBootstrapRuntime } from "../../../electron-app/renderer/testOnlyBootstrapRuntime.js";

describe("getRendererTestOnlyBootstrapRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("test-only-bootstrap-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getRendererTestOnlyBootstrapRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("ignores legacy direct AbortController scope properties", () => {
        expect.assertions(1);

        class LegacyAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-test-only-bootstrap-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getRendererTestOnlyBootstrapRuntime({
            AbortController: LegacyAbortController,
        } as unknown as Parameters<
            typeof getRendererTestOnlyBootstrapRuntime
        >[0]);

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer test-only bootstrap requires an AbortController runtime"
        );
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getRendererTestOnlyBootstrapRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow(
            "renderer test-only bootstrap requires an AbortController runtime"
        );
    });
});
