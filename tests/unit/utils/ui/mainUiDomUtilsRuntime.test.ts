import { describe, expect, it } from "vitest";

import { getMainUiDomUtilsRuntime } from "../../../../electron-app/utils/ui/mainUiDomUtilsRuntime.js";

describe("getMainUiDomUtilsRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("main-ui-dom-utils-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getMainUiDomUtilsRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime({});

        expect(() => {
            utils.createAbortController();
        }).toThrow("main UI DOM utilities require an AbortController runtime");
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        class TestAbortController implements AbortController {
            public readonly signal = {} as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const utils = getMainUiDomUtilsRuntime({
            AbortController: TestAbortController,
        } as unknown as Parameters<typeof getMainUiDomUtilsRuntime>[0]);

        expect(() => {
            utils.createAbortController();
        }).toThrow("main UI DOM utilities require an AbortController runtime");
        expect(utils).toHaveProperty("createAbortController");
    });
});
