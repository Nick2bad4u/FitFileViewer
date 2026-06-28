import { describe, expect, it } from "vitest";

import {
    getDomHelpersRuntime,
    type DomHelpersRuntimeScope,
} from "../../../electron-app/utils/dom/domHelpersRuntime.js";

function createDomHelpersRuntimeScope(
    overrides: Partial<DomHelpersRuntimeScope> = {}
): DomHelpersRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        ...overrides,
    };
}

describe("getDomHelpersRuntime", () => {
    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const utils = getDomHelpersRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

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
        const runtime = getDomHelpersRuntime(
            createDomHelpersRuntimeScope({
                getAbortController: () => TestAbortController,
            })
        );

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
        const runtime = getDomHelpersRuntime(
            createDomHelpersRuntimeScope({
                getAbortController: () => {
                    providerCount += 1;
                    return TestAbortController;
                },
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(providerCount).toBe(1);
        expect(controllerCount).toBe(1);
    });

    it("reads documents through provider functions", () => {
        expect.assertions(2);

        const documentRef = {
            querySelector: () => null,
        } as unknown as Document;
        let providerCount = 0;
        const runtime = getDomHelpersRuntime(
            createDomHelpersRuntimeScope({
                getDocument: () => {
                    providerCount += 1;
                    return documentRef;
                },
            })
        );

        expect(runtime.getDocument()).toBe(documentRef);
        expect(providerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getDomHelpersRuntime(createDomHelpersRuntimeScope());

        expect(() => {
            runtime.createAbortController();
        }).toThrow("dom helpers require an AbortController runtime");
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getDomHelpersRuntime(createDomHelpersRuntimeScope());

        expect(() => {
            runtime.getDocument();
        }).toThrow("dom helpers require a document runtime");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        const documentRef = {
            querySelector: () => null,
        } as unknown as Document;
        const signal = Symbol("legacy-dom-helpers-signal");
        class LegacyAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getDomHelpersRuntime({
            AbortController: LegacyAbortController,
            document: documentRef,
        } as unknown as Parameters<typeof getDomHelpersRuntime>[0]);

        expect(() => {
            runtime.createAbortController();
        }).toThrow("dom helpers require an AbortController provider");
        expect(() => {
            runtime.getDocument();
        }).toThrow("dom helpers require a document provider");
    });
});
