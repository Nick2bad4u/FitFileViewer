import { describe, expect, it } from "vitest";

import type { MapLapSelectorRuntimeScope } from "../../../../electron-app/utils/maps/controls/mapLapSelectorRuntime.js";
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
            getAbortController: () => TestAbortController,
        });

        expect(createAbortController()).toBeInstanceOf(TestAbortController);
        expect(controllerCount).toBe(1);
    });

    it("uses browser runtime providers for production AbortController defaults", () => {
        expect.assertions(1);

        const { createAbortController } = getMapLapSelectorRuntime();

        expect(createAbortController()).toBeInstanceOf(AbortController);
    });

    it("uses browser runtime providers for production DOM defaults", () => {
        expect.assertions(5);

        const runtime = getMapLapSelectorRuntime();
        const controller = new AbortController();
        const option = runtime.createElement("option");
        const changeEvent = runtime.createSelectChangeEvent();
        let mouseupCount = 0;

        runtime.addDocumentMouseupListener(
            () => {
                mouseupCount += 1;
            },
            { signal: controller.signal }
        );
        document.dispatchEvent(new MouseEvent("mouseup"));
        controller.abort();
        document.dispatchEvent(new MouseEvent("mouseup"));

        expect(option).toBeInstanceOf(HTMLOptionElement);
        expect(option.ownerDocument).toBe(document);
        expect(changeEvent).toBeInstanceOf(Event);
        expect(changeEvent.type).toBe("change");
        expect(mouseupCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const { createAbortController } = getMapLapSelectorRuntime({});

        expect(() => {
            createAbortController();
        }).toThrow("mapLapSelector requires an AbortController runtime");
    });

    it("creates elements through the injected document", () => {
        expect.assertions(2);

        const element = document.createElement("button");
        const runtime = getMapLapSelectorRuntime({
            getDocument: () =>
                ({
                    createElement: (tagName: string) => {
                        expect(tagName).toBe("button");

                        return element;
                    },
                }) as Pick<Document, "createElement">,
        });

        expect(runtime.createElement("button")).toBe(element);
    });

    it("creates select change events through the injected Event runtime", () => {
        expect.assertions(3);

        class TestEvent extends Event {
            public constructor(type: string) {
                super(`test:${type}`);
            }
        }
        const runtime = getMapLapSelectorRuntime({
            getEvent: () => TestEvent,
        });
        const event = runtime.createSelectChangeEvent();

        expect(event).toBeInstanceOf(TestEvent);
        expect(event.type).toBe("test:change");
        expect(event.bubbles).toBe(false);
    });

    it("fails clearly when the Event runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getMapLapSelectorRuntime({});

        expect(() => {
            runtime.createSelectChangeEvent();
        }).toThrow("mapLapSelector requires an Event runtime");
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
        const runtime = getMapLapSelectorRuntime({
            getDocument: () => documentRef,
        });

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
        const runtime = getMapLapSelectorRuntime({
            getDocument: () => documentRef,
        });

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
        expect.assertions(7);

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
            runtime.createElement("div");
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

    it("ignores legacy direct runtime scope properties", () => {
        expect.assertions(4);

        const eventTarget = new EventTarget();
        const documentRef = createDocumentRuntime(eventTarget);
        const legacyScope = {
            AbortController,
            document: documentRef,
            Event,
        } as unknown as MapLapSelectorRuntimeScope;
        const runtime = getMapLapSelectorRuntime(legacyScope);

        expect(() => {
            runtime.createAbortController();
        }).toThrow("mapLapSelector requires an AbortController runtime");
        expect(() => {
            runtime.addDocumentMouseupListener(() => undefined, {});
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.createElement("div");
        }).toThrow("mapLapSelector requires a document runtime");
        expect(() => {
            runtime.createSelectChangeEvent();
        }).toThrow("mapLapSelector requires an Event runtime");
    });
});

function createDocumentRuntime(
    eventTarget: EventTarget
): Pick<
    Document,
    "addEventListener" | "createElement" | "removeEventListener"
> {
    return {
        addEventListener: eventTarget.addEventListener.bind(eventTarget),
        createElement: document.createElement.bind(document),
        removeEventListener: eventTarget.removeEventListener.bind(eventTarget),
    } as Pick<
        Document,
        "addEventListener" | "createElement" | "removeEventListener"
    >;
}
