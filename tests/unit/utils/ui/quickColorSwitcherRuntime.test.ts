import { afterEach, describe, expect, it, vi } from "vitest";

import {
    getQuickColorSwitcherRuntime,
    type QuickColorSwitcherRuntimeScope,
} from "../../../../electron-app/utils/ui/quickColorSwitcherRuntime.js";

function createQuickColorSwitcherRuntimeScope(
    overrides: Partial<QuickColorSwitcherRuntimeScope> = {}
): QuickColorSwitcherRuntimeScope {
    return {
        getAbortController: () => undefined,
        getClearTimeout: () => undefined,
        getDocument: () => undefined,
        getNode: () => undefined,
        getSetTimeout: () => undefined,
        ...overrides,
    };
}

describe("getQuickColorSwitcherRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("quick-color-switcher-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope({
                getAbortController: () => TestAbortController,
            })
        );

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope()
        );

        expect(() => {
            runtime.createAbortController();
        }).toThrow("quickColorSwitcher requires an AbortController runtime");
    });

    it("registers document click listeners through the injected document runtime", () => {
        expect.assertions(1);

        const documentRef = document.implementation.createHTMLDocument(
            "quick color switcher"
        );
        let clicked = false;
        const listener = (): void => {
            clicked = true;
        };
        const controller = new AbortController();
        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        runtime.addDocumentClickListener(listener, {
            signal: controller.signal,
        });
        documentRef.dispatchEvent(new Event("click"));
        controller.abort();

        expect(clicked).toBe(true);
    });

    it("creates, queries, appends, and type-checks nodes through injected document providers", () => {
        expect.assertions(8);

        const documentRef = document.implementation.createHTMLDocument(
            "quick color switcher dom"
        );
        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope({
                getDocument: () => documentRef,
                getNode: () => Node,
            })
        );
        const switcher = runtime.createElement("div");
        const icon = runtime.createSvgElement("svg");
        const textNode = runtime.createTextNode("More Options");
        const style = runtime.createElement("style");

        switcher.id = "quick-color-switcher";
        style.id = "quick-color-switcher-styles";
        runtime.appendToBody(switcher);
        runtime.appendToHead(style);

        expect(switcher).toBeInstanceOf(HTMLDivElement);
        expect(icon).toBeInstanceOf(SVGSVGElement);
        expect(textNode.textContent).toBe("More Options");
        expect(runtime.querySelector("#quick-color-switcher")).toBe(switcher);
        expect(
            runtime.querySelector<HTMLStyleElement>(
                "#quick-color-switcher-styles"
            )
        ).toBe(style);
        expect(documentRef.body.contains(switcher)).toBe(true);
        expect(documentRef.head.contains(style)).toBe(true);
        expect(runtime.isNode(switcher)).toBe(true);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(6);

        const utils = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope()
        );
        const controller = new AbortController();

        expect(() => {
            utils.addDocumentClickListener(() => undefined, {
                signal: controller.signal,
            });
        }).toThrow("quickColorSwitcher requires a document runtime");
        expect(() => utils.createElement("div")).toThrow(
            "quickColorSwitcher requires a document runtime"
        );
        expect(() => utils.createSvgElement("svg")).toThrow(
            "quickColorSwitcher requires a document runtime"
        );
        expect(() => utils.createTextNode("More Options")).toThrow(
            "quickColorSwitcher requires a document runtime"
        );
        expect(() => utils.querySelector("#quick-color-switcher")).toThrow(
            "quickColorSwitcher requires a document runtime"
        );
        expect(() => utils.appendToBody(document.createElement("div"))).toThrow(
            "quickColorSwitcher requires a document runtime"
        );
        controller.abort();
    });

    it("schedules and clears timers through the injected runtime scope", () => {
        expect.assertions(3);

        const callback = vi.fn<() => void>();
        const timeoutMs = Number("500");
        const timer = 37 as ReturnType<typeof globalThis.setTimeout>;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope({
                getClearTimeout: () => clearTimeout,
                getSetTimeout: () => setTimeout,
            })
        );

        expect(runtime.setTimeout(callback, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);

        expect(setTimeout).toHaveBeenCalledWith(callback, timeoutMs);
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(2);

        class TestAbortController implements AbortController {
            public readonly signal = Symbol(
                "legacy-quick-color-switcher-signal"
            ) as unknown as AbortSignal;

            public abort(): void {
                /* Test double */
            }
        }
        const documentRef = document.implementation.createHTMLDocument(
            "legacy quick color switcher"
        );
        const nodeConstructor = Node;
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const setTimeout = vi.fn<typeof globalThis.setTimeout>();
        const legacyScope = {
            AbortController: TestAbortController,
            clearTimeout,
            document: documentRef,
            Node: nodeConstructor,
            setTimeout,
        } as unknown as QuickColorSwitcherRuntimeScope;
        const controller = new AbortController();

        expect(() => getQuickColorSwitcherRuntime(legacyScope)).toThrow(
            "quickColorSwitcher requires an AbortController provider"
        );
        expect(clearTimeout).not.toHaveBeenCalled();

        controller.abort();
    });

    it("fails clearly when runtime provider slots are omitted", () => {
        expect.assertions(1);

        expect(() =>
            getQuickColorSwitcherRuntime(
                {} as unknown as QuickColorSwitcherRuntimeScope
            )
        ).toThrow("quickColorSwitcher requires an AbortController provider");
    });

    it("fails clearly when runtime provider slots are undefined", () => {
        expect.assertions(5);

        expect(() =>
            getQuickColorSwitcherRuntime(
                createQuickColorSwitcherRuntimeScope({
                    getAbortController: undefined,
                })
            )
        ).toThrow("quickColorSwitcher requires an AbortController provider");
        expect(() =>
            getQuickColorSwitcherRuntime(
                createQuickColorSwitcherRuntimeScope({
                    getClearTimeout: undefined,
                })
            )
        ).toThrow("quickColorSwitcher requires a clearTimeout provider");
        expect(() =>
            getQuickColorSwitcherRuntime(
                createQuickColorSwitcherRuntimeScope({
                    getDocument: undefined,
                })
            )
        ).toThrow("quickColorSwitcher requires a document provider");
        expect(() =>
            getQuickColorSwitcherRuntime(
                createQuickColorSwitcherRuntimeScope({
                    getNode: undefined,
                })
            )
        ).toThrow("quickColorSwitcher requires a Node provider");
        expect(() =>
            getQuickColorSwitcherRuntime(
                createQuickColorSwitcherRuntimeScope({
                    getSetTimeout: undefined,
                })
            )
        ).toThrow("quickColorSwitcher requires a setTimeout provider");
    });

    it("does not borrow ambient timers for explicit scopes", () => {
        expect.assertions(2);

        const runtime = getQuickColorSwitcherRuntime(
            createQuickColorSwitcherRuntimeScope()
        );

        expect(() => runtime.setTimeout(() => {}, 0)).toThrow(
            "quickColorSwitcher requires a setTimeout runtime"
        );
        expect(() => runtime.clearTimeout(0)).toThrow(
            "quickColorSwitcher requires a clearTimeout runtime"
        );
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(10);

        const controller = new AbortController();
        const timeoutMs = Number("250");
        const timer = Number("12");
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const clearTimeout = vi.fn<typeof globalThis.clearTimeout>();
        const documentRef = document.implementation.createHTMLDocument(
            "quick color default"
        );
        const nodeConstructor = Node;
        const setTimeout = vi.fn<typeof globalThis.setTimeout>(() => timer);
        const runtime = getQuickColorSwitcherRuntime();

        vi.stubGlobal("AbortController", AbortControllerConstructor);
        vi.stubGlobal("clearTimeout", clearTimeout);
        vi.stubGlobal("document", documentRef);
        vi.stubGlobal("Node", nodeConstructor);
        vi.stubGlobal("setTimeout", setTimeout);

        expect(runtime.createAbortController()).toBe(controller);
        let clicked = false;
        runtime.addDocumentClickListener(
            () => {
                clicked = true;
            },
            { signal: controller.signal }
        );
        documentRef.dispatchEvent(new Event("click"));
        expect(runtime.setTimeout(() => {}, timeoutMs)).toBe(timer);
        runtime.clearTimeout(timer);
        const switcher = runtime.createElement("div");
        switcher.id = "quick-color-switcher";
        const icon = runtime.createSvgElement("svg");
        const label = runtime.createTextNode("More Options");
        runtime.appendToBody(switcher);

        expect(clicked).toBe(true);
        expect(icon).toBeInstanceOf(SVGSVGElement);
        expect(label.textContent).toBe("More Options");
        expect(runtime.querySelector("#quick-color-switcher")).toBe(switcher);
        expect(runtime.isNode(switcher)).toBe(true);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
        expect(setTimeout).toHaveBeenCalledWith(
            expect.any(Function),
            timeoutMs
        );
        expect(clearTimeout).toHaveBeenCalledWith(timer);
    });
});
