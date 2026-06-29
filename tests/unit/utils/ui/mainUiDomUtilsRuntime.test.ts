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
            getDocument: () => document,
        });

        expect(utils.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("resolves flexible element ids through the injected document provider", () => {
        expect.assertions(2);

        const documentRef =
            document.implementation.createHTMLDocument("main UI DOM utils");
        const element = documentRef.createElement("div");
        element.id = "alt-fit-iframe";
        documentRef.body.append(element);
        const utils = getMainUiDomUtilsRuntime({
            getAbortController: () => AbortController,
            getDocument: () => documentRef,
        });

        expect(utils.getElementByIdFlexible("alt_fit_iframe")).toBe(element);
        expect(utils.getElementByIdFlexible("altFitIframe")).toBe(element);
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
            getDocument: () => document,
        });

        expect(() => {
            utils.createAbortController();
        }).toThrow("main UI DOM utilities require an AbortController runtime");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime({
            getAbortController: () => AbortController,
            getDocument: () => undefined,
        });

        expect(() => {
            utils.getElementByIdFlexible("alt_fit_iframe");
        }).toThrow("main UI DOM utilities require a document runtime");
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

    it("fails clearly when the AbortController provider slot is omitted", () => {
        expect.assertions(1);

        const utils = getMainUiDomUtilsRuntime({
            getAbortController: undefined,
        });

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
