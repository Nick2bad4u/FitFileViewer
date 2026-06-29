import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getCreatePrintButtonRuntime,
    type CreatePrintButtonRuntimeScope,
} from "../../../../../electron-app/utils/files/export/createPrintButtonRuntime.js";

function createUnavailableRuntimeScope(
    overrides: Partial<CreatePrintButtonRuntimeScope> = {}
): CreatePrintButtonRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getPrint: () => undefined,
        ...overrides,
    };
}

describe("getCreatePrintButtonRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("create-print-button-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getCreatePrintButtonRuntime(
            createUnavailableRuntimeScope({
                getAbortController: () => TestAbortController,
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getCreatePrintButtonRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production document and print defaults", () => {
        expect.assertions(4);

        const print = vi.fn();

        vi.stubGlobal("document", document);
        vi.stubGlobal("print", print);

        const runtime = getCreatePrintButtonRuntime();

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);

        runtime.print();

        expect(print).toHaveBeenCalledOnce();
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getCreatePrintButtonRuntime(
            createUnavailableRuntimeScope()
        );

        expect(() => {
            runtime.createAbortController();
        }).toThrow("createPrintButton requires an AbortController runtime");
    });

    it("creates HTML and SVG elements through the injected document", () => {
        expect.assertions(3);

        const runtime = getCreatePrintButtonRuntime(
            createUnavailableRuntimeScope({
                getDocument: () => document,
            })
        );

        expect(runtime.createButton()).toBeInstanceOf(HTMLButtonElement);
        expect(runtime.createElement("span")).toBeInstanceOf(HTMLSpanElement);
        expect(runtime.createSvgElement("svg")).toBeInstanceOf(SVGSVGElement);
    });

    it("invokes the injected print function", () => {
        expect.assertions(1);

        let printed = false;
        const print = (): void => {
            printed = true;
        };

        getCreatePrintButtonRuntime(
            createUnavailableRuntimeScope({ getPrint: () => print })
        ).print();

        expect(printed).toBe(true);
    });

    it("does nothing when print is unavailable", () => {
        expect.assertions(1);

        expect(() =>
            getCreatePrintButtonRuntime(createUnavailableRuntimeScope()).print()
        ).not.toThrow();
    });

    it("fails clearly when required runtime providers are missing", () => {
        expect.assertions(3);

        expect(() =>
            getCreatePrintButtonRuntime({
                getDocument: () => document,
                getPrint: () => undefined,
            } as unknown as CreatePrintButtonRuntimeScope).createAbortController()
        ).toThrow("createPrintButton requires an AbortController provider");
        expect(() =>
            getCreatePrintButtonRuntime({
                getAbortController: () => AbortController,
                getPrint: () => undefined,
            } as unknown as CreatePrintButtonRuntimeScope).createButton()
        ).toThrow("createPrintButton requires a document provider");
        expect(() =>
            getCreatePrintButtonRuntime({
                getAbortController: () => AbortController,
                getDocument: () => document,
            } as unknown as CreatePrintButtonRuntimeScope).print()
        ).toThrow("createPrintButton requires a print provider");
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        let printed = false;
        const legacyScope = {
            AbortController,
            document,
            print: () => {
                printed = true;
            },
        } as unknown as CreatePrintButtonRuntimeScope;
        const runtime = getCreatePrintButtonRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "createPrintButton requires an AbortController provider"
        );
        expect(() => runtime.createButton()).toThrow(
            "createPrintButton requires a document provider"
        );
        expect(() => runtime.print()).toThrow(
            "createPrintButton requires a print provider"
        );
        expect(printed).toBe(false);
    });
});
