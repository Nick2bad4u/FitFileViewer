import { describe, expect, it } from "vitest";

import {
    getMainUiDomUtilsRuntime,
    type MainUiDomUtilsRuntimeScope,
} from "../../../../electron-app/utils/ui/mainUiDomUtilsRuntime.js";

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

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime({
            getAbortController: () => undefined,
        });

        expect(() => {
            utils.createAbortController();
        }).toThrow("main UI DOM utilities require an AbortController runtime");
    });

    it("fails clearly when the AbortController provider is omitted", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime(
            {} as unknown as MainUiDomUtilsRuntimeScope
        );

        expect(() => {
            utils.createAbortController();
        }).toThrow("main UI DOM utilities require an AbortController provider");
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
        }).toThrow("main UI DOM utilities require an AbortController provider");
        expect(utils).toHaveProperty("createAbortController");
    });
});
