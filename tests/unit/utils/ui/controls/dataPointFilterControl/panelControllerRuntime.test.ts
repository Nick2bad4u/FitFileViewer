import { describe, expect, it, vi } from "vitest";

import { getDataPointFilterPanelControllerRuntime } from "../../../../../../electron-app/utils/ui/controls/dataPointFilterControl/panelControllerRuntime.js";

describe("getDataPointFilterPanelControllerRuntime", () => {
    it("reads body, viewport size, and Node checks from injected runtimes", () => {
        expect.assertions(4);

        const runtime = getDataPointFilterPanelControllerRuntime({
            document,
            Node,
            viewport: {
                addEventListener: vi.fn(),
                innerHeight: 600,
                innerWidth: 800,
            },
        });

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
        const runtime = getDataPointFilterPanelControllerRuntime({
            document,
            Node,
            viewport,
        });
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
        const runtime = getDataPointFilterPanelControllerRuntime({
            cancelAnimationFrame,
            document,
            requestAnimationFrame,
        });
        const callback = vi.fn();

        const handle = runtime.requestAnimationFrame(callback);
        runtime.cancelAnimationFrame(handle);

        expect(handle).toBe(13);
        expect(callback).toHaveBeenCalledTimes(1);
        expect(requestAnimationFrame).toHaveBeenCalledWith(callback);
        expect(cancelAnimationFrame).toHaveBeenCalledWith(13);
    });

    it("fails clearly when required runtimes are unavailable", () => {
        expect.assertions(4);

        const runtime = getDataPointFilterPanelControllerRuntime({});
        const runtimeWithoutNode = getDataPointFilterPanelControllerRuntime({
            document: {
                addEventListener: vi.fn(),
                body: document.body,
            } as unknown as Document,
        });

        expect(() => runtime.getBody()).toThrow(
            "data point filter panel controller requires a document runtime"
        );
        expect(() => runtimeWithoutNode.isNode(document.body)).toThrow(
            "data point filter panel controller requires a Node runtime"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                document,
                requestAnimationFrame:
                    "requestAnimationFrame" as unknown as typeof requestAnimationFrame,
            }).requestAnimationFrame(() => {})
        ).toThrow(
            "data point filter panel controller requires a requestAnimationFrame runtime"
        );
        expect(() =>
            getDataPointFilterPanelControllerRuntime({
                cancelAnimationFrame:
                    "cancelAnimationFrame" as unknown as typeof cancelAnimationFrame,
                document,
            }).cancelAnimationFrame(1)
        ).toThrow(
            "data point filter panel controller requires a cancelAnimationFrame runtime"
        );
    });
});
