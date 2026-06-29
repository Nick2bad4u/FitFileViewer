import { describe, expect, it, vi } from "vitest";

import {
    getSummaryColModalRuntime,
    type SummaryColModalRuntimeScope,
} from "../../../../../electron-app/utils/rendering/helpers/summaryColModalRuntime.js";

function createSummaryColModalRuntimeScope(
    overrides: Partial<SummaryColModalRuntimeScope> = {}
): SummaryColModalRuntimeScope {
    return {
        getAbortController: () => undefined,
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
        getKeyboardEvent: () => undefined,
        getMouseEvent: () => undefined,
        getViewport: () => undefined,
        ...overrides,
    };
}

describe("getSummaryColModalRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("summary-col-modal-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope({
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

        const utils = getSummaryColModalRuntime();

        expect(utils.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM and event defaults", () => {
        expect.assertions(7);

        const runtime = getSummaryColModalRuntime();
        const button = document.createElement("button");

        document.body.append(button);
        button.focus();

        try {
            const div = runtime.createElement("div");
            const text = runtime.createTextNode("Modal text");

            expect(div).toBeInstanceOf(HTMLDivElement);
            expect(text.data).toBe("Modal text");
            expect(runtime.getActiveElement()).toBe(button);
            expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
                true
            );
            expect(runtime.isMouseEvent(new MouseEvent("mousedown"))).toBe(
                true
            );
            expect(runtime.getViewport().height).toBe(globalThis.innerHeight);
            expect(runtime.getViewport().width).toBe(globalThis.innerWidth);
        } finally {
            button.remove();
        }
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope()
        );

        expect(() => {
            runtime.createAbortController();
        }).toThrow("summaryColModal requires an AbortController runtime");
    });

    it("reads viewport dimensions from an injected runtime scope", () => {
        expect.assertions(1);

        expect(
            getSummaryColModalRuntime(
                createSummaryColModalRuntimeScope({
                    getViewport: () => ({
                        height: 900,
                        width: 1440,
                    }),
                })
            ).getViewport()
        ).toStrictEqual({
            height: 900,
            width: 1440,
        });
    });

    it("routes document operations through the injected document", () => {
        expect.assertions(7);

        const documentRef = document;
        const button = documentRef.createElement("button");
        documentRef.body.append(button);
        button.focus();
        const createElement = vi.spyOn(documentRef, "createElement");
        const createTextNode = vi.spyOn(documentRef, "createTextNode");
        const bodyAppend = vi.spyOn(documentRef.body, "append");
        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope({
                getDocument: () => documentRef,
                getHTMLElement: () => HTMLElement,
            })
        );

        const div = runtime.createElement("div");
        const text = runtime.createTextNode("Modal text");
        runtime.appendToBody(div);

        expect(div).toBeInstanceOf(HTMLDivElement);
        expect(text.data).toBe("Modal text");
        expect(runtime.getActiveElement()).toBe(button);
        expect(createElement).toHaveBeenCalledWith("div");
        expect(createTextNode).toHaveBeenCalledWith("Modal text");
        expect(bodyAppend).toHaveBeenCalledWith(div);
        expect(documentRef.body.contains(div)).toBe(true);
    });

    it("returns null when active element type checks are unavailable", () => {
        expect.assertions(1);

        expect(
            getSummaryColModalRuntime(
                createSummaryColModalRuntimeScope({
                    getDocument: () =>
                        document.implementation.createHTMLDocument(
                            "summary modal"
                        ),
                })
            ).getActiveElement()
        ).toBeNull();
    });

    it("checks keyboard events through the injected constructor provider", () => {
        expect.assertions(3);

        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope({
                getKeyboardEvent: () => KeyboardEvent,
            })
        );

        expect(runtime.isKeyboardEvent(new KeyboardEvent("keydown"))).toBe(
            true
        );
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(runtime.isKeyboardEvent({ key: "Escape" })).toBe(false);
    });

    it("checks mouse events through the injected constructor provider", () => {
        expect.assertions(3);

        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope({
                getMouseEvent: () => MouseEvent,
            })
        );

        expect(runtime.isMouseEvent(new MouseEvent("mousedown"))).toBe(true);
        expect(runtime.isMouseEvent(new Event("mousedown"))).toBe(false);
        expect(runtime.isMouseEvent({ shiftKey: true })).toBe(false);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(6);

        const runtime = getSummaryColModalRuntime(
            createSummaryColModalRuntimeScope()
        );

        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("summaryColModal requires a document runtime");
        expect(() => runtime.createElement("div")).toThrow(
            "summaryColModal requires a document runtime"
        );
        expect(() => runtime.createTextNode("Modal text")).toThrow(
            "summaryColModal requires a document runtime"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "summaryColModal requires a document runtime"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "summaryColModal requires a KeyboardEvent runtime"
        );
        expect(() => runtime.isMouseEvent(new Event("mousedown"))).toThrow(
            "summaryColModal requires a MouseEvent runtime"
        );
    });

    it("uses zero dimensions when viewport values are unavailable", () => {
        expect.assertions(1);

        expect(
            getSummaryColModalRuntime(
                createSummaryColModalRuntimeScope()
            ).getViewport()
        ).toStrictEqual({
            height: 0,
            width: 0,
        });
    });

    it("fails clearly when explicit runtime provider slots are omitted", () => {
        expect.assertions(6);

        const runtime = getSummaryColModalRuntime(
            {} as unknown as SummaryColModalRuntimeScope
        );

        expect(() => runtime.createAbortController()).toThrow(
            "summaryColModal requires AbortController provider"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "summaryColModal requires document provider"
        );
        expect(() =>
            getSummaryColModalRuntime({
                ...createSummaryColModalRuntimeScope(),
                getDocument: () => document,
                getHTMLElement: undefined,
            }).getActiveElement()
        ).toThrow("summaryColModal requires HTMLElement provider");
        expect(() => runtime.getViewport()).toThrow(
            "summaryColModal requires viewport provider"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "summaryColModal requires KeyboardEvent provider"
        );
        expect(() => runtime.isMouseEvent(new Event("mousedown"))).toThrow(
            "summaryColModal requires MouseEvent provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(8);

        const legacyScope = {
            AbortController,
            document,
            HTMLElement,
            KeyboardEvent,
            MouseEvent,
            innerHeight: 900,
            innerWidth: 1440,
        } as unknown as SummaryColModalRuntimeScope;
        const runtime = getSummaryColModalRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "summaryColModal requires AbortController provider"
        );
        expect(() => runtime.getViewport()).toThrow(
            "summaryColModal requires viewport provider"
        );
        expect(() =>
            runtime.appendToBody(document.createElement("div"))
        ).toThrow("summaryColModal requires document provider");
        expect(() => runtime.createElement("div")).toThrow(
            "summaryColModal requires document provider"
        );
        expect(() => runtime.createTextNode("Modal text")).toThrow(
            "summaryColModal requires document provider"
        );
        expect(() => runtime.getActiveElement()).toThrow(
            "summaryColModal requires document provider"
        );
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "summaryColModal requires KeyboardEvent provider"
        );
        expect(() => runtime.isMouseEvent(new Event("mousedown"))).toThrow(
            "summaryColModal requires MouseEvent provider"
        );
    });
});
