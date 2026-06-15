import { describe, expect, it } from "vitest";

import { getMapLapSelectorRuntime } from "../../../../electron-app/utils/maps/controls/mapLapSelectorRuntime.js";

describe("getMapLapSelectorRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("map-lap-selector-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const { createAbortController } = getMapLapSelectorRuntime({
            AbortController: TestAbortController,
        });

        expect(createAbortController()).toBeInstanceOf(TestAbortController);
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const { createAbortController } = getMapLapSelectorRuntime({});

        expect(() => {
            createAbortController();
        }).toThrow("mapLapSelector requires an AbortController runtime");
    });

    it("registers and removes document mouseup listeners through the injected document", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        const documentRef = createDocumentRuntime(eventTarget);
        const controller = new AbortController();
        let mouseupCount = 0;
        const listener = (): void => {
            mouseupCount += 1;
        };
        const runtime = getMapLapSelectorRuntime({ document: documentRef });

        runtime.addDocumentMouseupListener(listener, {
            signal: controller.signal,
        });
        eventTarget.dispatchEvent(new MouseEvent("mouseup"));
        runtime.removeDocumentMouseupListener(listener);
        eventTarget.dispatchEvent(new MouseEvent("mouseup"));

        expect(mouseupCount).toBe(1);
        expect(controller.signal.aborted).toBe(false);
    });

    it("registers and removes pinned tooltip document listeners through the injected document", () => {
        expect.assertions(2);

        const eventTarget = new EventTarget();
        const documentRef = createDocumentRuntime(eventTarget);
        const controller = new AbortController();
        let mousedownCount = 0;
        let keydownCount = 0;
        const mousedownListener = (): void => {
            mousedownCount += 1;
        };
        const keydownListener = (): void => {
            keydownCount += 1;
        };
        const runtime = getMapLapSelectorRuntime({ document: documentRef });

        runtime.addDocumentMousedownListener(mousedownListener, {
            capture: true,
            signal: controller.signal,
        });
        runtime.addDocumentKeydownListener(keydownListener, {
            signal: controller.signal,
        });
        eventTarget.dispatchEvent(new MouseEvent("mousedown"));
        eventTarget.dispatchEvent(new KeyboardEvent("keydown"));
        runtime.removeDocumentMousedownListener(mousedownListener);
        runtime.removeDocumentKeydownListener(keydownListener);
        eventTarget.dispatchEvent(new MouseEvent("mousedown"));
        eventTarget.dispatchEvent(new KeyboardEvent("keydown"));

        expect(mousedownCount).toBe(1);
        expect(keydownCount).toBe(1);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(6);

        const runtime = getMapLapSelectorRuntime({});
        const controller = new AbortController();
        const keydownListener = (): void => undefined;
        const mouseListener = (): void => undefined;

        expect(() => {
            runtime.addDocumentKeydownListener(keydownListener, {
                signal: controller.signal,
            });
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.addDocumentMousedownListener(mouseListener, {
                signal: controller.signal,
            });
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.addDocumentMouseupListener(mouseListener, {
                signal: controller.signal,
            });
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.removeDocumentKeydownListener(keydownListener);
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.removeDocumentMousedownListener(mouseListener);
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.removeDocumentMouseupListener(mouseListener);
        }).toThrow("mapLapSelector requires a document runtime");
        controller.abort();
    });
});

function createDocumentRuntime(
    eventTarget: EventTarget
): Pick<Document, "addEventListener" | "removeEventListener"> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    } as Pick<Document, "addEventListener" | "removeEventListener">;
}
