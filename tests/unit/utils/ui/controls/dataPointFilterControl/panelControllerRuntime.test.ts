import { afterEach, describe, expect, it, vi } from "vitest";

import type { BrowserAbortControllerConstructor } from "../../../../../../electron-app/utils/runtime/browserRuntime.js";
import {
    getDataPointFilterPanelControllerRuntime,
    type DataPointFilterPanelControllerRuntimeScope,
} from "../../../../../../electron-app/utils/ui/controls/dataPointFilterControl/panelControllerRuntime.js";

function createDataPointFilterPanelControllerRuntimeScope(
    overrides: Partial<DataPointFilterPanelControllerRuntimeScope> = {}
): DataPointFilterPanelControllerRuntimeScope {
    return {
        getAbortController: () => undefined,
        getCancelAnimationFrame: () => undefined,
        getDocument: () => undefined,
        getNode: () => undefined,
        getRequestAnimationFrame: () => undefined,
        getViewport: () => undefined,
        ...overrides,
    };
}

describe("getDataPointFilterPanelControllerRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("reads body, viewport size, and Node checks from injected runtimes", () => {
        expect.assertions(4);

        const runtime = getDataPointFilterPanelControllerRuntime(
            createDataPointFilterPanelControllerRuntimeScope({
                getDocument: () => document,
                getNode: () => Node,
                getViewport: () => ({
                    addEventListener: vi.fn(),
                    innerHeight: 600,
                    innerWidth: 800,
                }),
            })
        );

        expect(runtime.getBody()).toBe(document.body);
        expect(runtime.getViewportSize()).toStrictEqual({
            height: 600,
            width: 800,
        });
        expect(runtime.isNode(document.body)).toBe(true);
        expect(runtime.isNode({})).toBe(false);
    });

    it("wires document and viewport listeners through injected targets", () => {
        expect.assertions(4);

        const listenerController = new AbortController();
        const viewport = Object.assign(new EventTarget(), {
            innerHeight: 600,
            innerWidth: 800,
        });
        const runtime = getDataPointFilterPanelControllerRuntime(
            createDataPointFilterPanelControllerRuntimeScope({
                getDocument: () => document,
                getNode: () => Node,
                getViewport: () => viewport,
            })
        );
        let documentMouseDownCount = 0;
        let documentKeydownCount = 0;
        let viewportResizeCount = 0;
        let viewportScrollCount = 0;
        const options = {
            capture: true,
            signal: listenerController.signal,
        } satisfies AddEventListenerOptions;

        runtime.addDocumentMouseDownListener(() => {
            documentMouseDownCount += 1;
        }, options);
        runtime.addDocumentKeydownListener(() => {
            documentKeydownCount += 1;
        }, options);
        runtime.addViewportResizeListener(() => {
            viewportResizeCount += 1;
        }, options);
        runtime.addViewportScrollListener(() => {
            viewportScrollCount += 1;
        }, options);
        document.dispatchEvent(new MouseEvent("mousedown"));
        document.dispatchEvent(new KeyboardEvent("keydown"));
        viewport.dispatchEvent(new Event("resize"));
        viewport.dispatchEvent(new Event("scroll"));
        listenerController.abort();

        expect(documentMouseDownCount).toBe(1);
        expect(documentKeydownCount).toBe(1);
        expect(viewportResizeCount).toBe(1);
        expect(viewportScrollCount).toBe(1);
    });

    it("schedules and cancels animation frames through injected runtimes", () => {
        expect.assertions(4);

        const requestAnimationFrame = vi.fn(
            (callback: FrameRequestCallback) => {
                callback(0);
                return 13;
            }
        );
        const cancelAnimationFrame = vi.fn();
        const runtime = getDataPointFilterPanelControllerRuntime(
            createDataPointFilterPanelControllerRuntimeScope({
                getCancelAnimationFrame: () => cancelAnimationFrame,
                getDocument: () => document,
                getRequestAnimationFrame: () => requestAnimationFrame,
            })
        );
        const callback = vi.fn();

        const handle = runtime.requestAnimationFrame(callback);
        runtime.cancelAnimationFrame(handle);

        expect(handle).toBe(13);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(13);
    });

    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const runtime = getDataPointFilterPanelControllerRuntime(
            createDataPointFilterPanelControllerRuntimeScope({
                getAbortController: () => AbortController,
                getDocument: () => document,
            })
        );
        const controller = runtime.createAbortController();

        expect(controller).toBeInstanceOf(AbortController);
        expect(controller.signal.aborted).toBe(false);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const runtime = getDataPointFilterPanelControllerRuntime();

        expect(runtime.createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production panel defaults", () => {
        expect.assertions(5);

        const requestAnimationFrame = vi.fn(
            (callback: FrameRequestCallback) => {
                callback(0);
                return 17;
            }
        );
        const cancelAnimationFrame = vi.fn();

        vi.stubGlobal("cancelAnimationFrame", cancelAnimationFrame);
        vi.stubGlobal("document", document);
        vi.stubGlobal("Node", Node);
        vi.stubGlobal("requestAnimationFrame", requestAnimationFrame);

        const runtime = getDataPointFilterPanelControllerRuntime();
        const callback = vi.fn();
        const handle = runtime.requestAnimationFrame(callback);

        runtime.cancelAnimationFrame(handle);

        expect(runtime.getBody()).toBe(document.body);
        expect(runtime.isNode(document.body)).toBe(true);
        expect(handle).toBe(17);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(17);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(5);

        const runtime = getDataPointFilterPanelControllerRuntime(
            createDataPointFilterPanelControllerRuntimeScope()
        );
        const runtimeWithInvalidAbortController =
            getDataPointFilterPanelControllerRuntime(
                createDataPointFilterPanelControllerRuntimeScope({
                    getAbortController: () =>
                        "AbortController" as unknown as BrowserAbortControllerConstructor,
                    getDocument: () => document,
                })
            );
        const runtimeWithoutNode = getDataPointFilterPanelControllerRuntime({
            ...createDataPointFilterPanelControllerRuntimeScope(),
            getDocument: () =>
                ({
                    addEventListener: vi.fn(),
                    body: document.body,
                }) as unknown as Document,
        });

        expect(() => runtime.getBody()).toThrow(
            "data point filter panel controller requires a document runtime"
        );
        expect(() =>
            runtimeWithInvalidAbortController.createAbortController()
        ).toThrow(
            "data point filter panel controller requires an AbortController runtime"
        );
        expect(() => runtimeWithoutNode.isNode(document.body)).toThrow(
            "data point filter panel controller requires a Node runtime"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...createDataPointFilterPanelControllerRuntimeScope({
                    getDocument: () => document,
                    getRequestAnimationFrame: () =>
                        "requestAnimationFrame" as unknown as typeof requestAnimationFrame,
                }),
            }).requestAnimationFrame(() => {})
        ).toThrow(
            "data point filter panel controller requires a requestAnimationFrame runtime"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...createDataPointFilterPanelControllerRuntimeScope({
                    getCancelAnimationFrame: () =>
                        "cancelAnimationFrame" as unknown as typeof cancelAnimationFrame,
                    getDocument: () => document,
                }),
            }).cancelAnimationFrame(1)
        ).toThrow(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    });

    it("fails clearly when required runtime providers are omitted", () => {
        expect.assertions(6);

        const scope = createDataPointFilterPanelControllerRuntimeScope();

        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getAbortController: undefined,
            })
        ).toThrow(
            "data point filter panel controller requires AbortController provider"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getCancelAnimationFrame: undefined,
            })
        ).toThrow(
            "data point filter panel controller requires cancelAnimationFrame provider"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getDocument: undefined,
            })
        ).toThrow(
            "data point filter panel controller requires document provider"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getNode: undefined,
            })
        ).toThrow("data point filter panel controller requires Node provider");
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getRequestAnimationFrame: undefined,
            })
        ).toThrow(
            "data point filter panel controller requires requestAnimationFrame provider"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                ...scope,
                getViewport: undefined,
            })
        ).toThrow(
            "data point filter panel controller requires viewport provider"
        );
    });

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(6);

        const requestAnimationFrame = vi.fn(() => 13);
        const cancelAnimationFrame = vi.fn();
        const viewport = Object.assign(new EventTarget(), {
            innerHeight: 600,
            innerWidth: 800,
        });
        const legacyScope = {
            ...createDataPointFilterPanelControllerRuntimeScope(),
            AbortController,
            cancelAnimationFrame,
            document,
            Node,
            requestAnimationFrame,
            viewport,
        } as unknown as DataPointFilterPanelControllerRuntimeScope;
        const runtime = getDataPointFilterPanelControllerRuntime(legacyScope);

        expect(() => runtime.createAbortController()).toThrow(
            "data point filter panel controller requires an AbortController runtime"
        );
        expect(() => runtime.getBody()).toThrow(
            "data point filter panel controller requires a document runtime"
        );
        expect(() => runtime.isNode(document.body)).toThrow(
            "data point filter panel controller requires a Node runtime"
        );
        expect(() => runtime.getViewportSize()).toThrow(
            "data point filter panel controller requires a viewport runtime"
        );
        expect(() => runtime.requestAnimationFrame(() => {})).toThrow(
            "data point filter panel controller requires a requestAnimationFrame runtime"
        );
        expect(() => runtime.cancelAnimationFrame(1)).toThrow(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    });
});
