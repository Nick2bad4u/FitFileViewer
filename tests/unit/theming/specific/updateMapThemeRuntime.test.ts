import { describe, expect, it, vi } from "vitest";

import { getUpdateMapThemeRuntime } from "../../../../electron-app/utils/theming/specific/updateMapThemeRuntime.js";

describe("getUpdateMapThemeRuntime", () => {
    it("creates abort controllers through the injected runtime scope", () => {
        expect.assertions(2);

        let controllerCount = 0;
        const signal = Symbol("update-map-theme-signal");
        class TestAbortController implements AbortController {
            public readonly signal = signal as unknown as AbortSignal;

            public constructor() {
                controllerCount += 1;
            }

            public abort(): void {
                /* Test double */
            }
        }
        const runtime = getUpdateMapThemeRuntime({
            getAbortController: () => TestAbortController,
        });

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
    });

    it("fails clearly when the AbortController runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getUpdateMapThemeRuntime({});

        expect(() => {
            runtime.createAbortController();
        }).toThrow("updateMapTheme requires an AbortController runtime");
    });

    it("queries the Leaflet map through the injected document", () => {
        expect.assertions(1);

        try {
            const map = document.createElement("div");
            map.id = "leaflet-map";
            document.body.append(map);

            expect(
                getUpdateMapThemeRuntime({
                    getDocument: () => document,
                }).queryLeafletMap()
            ).toBe(map);
        } finally {
            document.body.replaceChildren();
        }
    });

    it("wraps document listener registration", () => {
        expect.assertions(1);

        const eventTarget = new EventTarget();
        let eventCount = 0;
        const listener = (): void => {
            eventCount += 1;
        };
        const documentLike = {
            addEventListener: eventTarget.addEventListener.bind(eventTarget),
            querySelector: vi.fn<Document["querySelector"]>(),
        } as unknown as Document;
        const runtime = getUpdateMapThemeRuntime({
            getDocument: () => documentLike,
        });

        runtime.addDocumentListener("themechange", listener, {
            passive: true,
        });
        eventTarget.dispatchEvent(new Event("themechange"));

        expect(eventCount).toBe(1);
    });

    it("wraps window beforeunload listener registration", () => {
        expect.assertions(1);

        const eventTarget = new EventTarget();
        let eventCount = 0;
        const listener = (): void => {
            eventCount += 1;
        };
        const runtime = getUpdateMapThemeRuntime({
            getBeforeUnloadTarget: () => ({
                addEventListener:
                    eventTarget.addEventListener.bind(eventTarget),
            }),
        });

        runtime.addWindowBeforeUnloadListener(listener, {
            passive: true,
        });
        eventTarget.dispatchEvent(new Event("beforeunload"));

        expect(eventCount).toBe(1);
    });

    it("routes runtime dependencies through provider functions", () => {
        expect.assertions(6);

        let controllerCount = 0;
        const map = document.createElement("div");
        map.id = "leaflet-map";
        const documentLike = {
            addEventListener: vi.fn<Document["addEventListener"]>(),
            querySelector: vi.fn<Document["querySelector"]>(() => map),
        } as unknown as Document;
        const beforeUnloadTarget = new EventTarget();
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const runtime = getUpdateMapThemeRuntime({
            getAbortController: () => TestAbortController,
            getBeforeUnloadTarget: () => beforeUnloadTarget,
            getDocument: () => documentLike,
            getHTMLElement: () => HTMLElement,
        });

        let unloadCount = 0;
        runtime.addWindowBeforeUnloadListener(() => {
            unloadCount += 1;
        }, {});
        beforeUnloadTarget.dispatchEvent(new Event("beforeunload"));

        expect(runtime.createAbortController()).toBeInstanceOf(
            TestAbortController
        );
        expect(controllerCount).toBe(1);
        expect(runtime.queryLeafletMap()).toBe(map);
        expect(runtime.isHTMLElement(map)).toBe(true);
        expect(unloadCount).toBe(1);
        expect(getUpdateMapThemeRuntime({}).queryLeafletMap()).toBeNull();
    });

    it("checks HTMLElement instances through the injected constructor", () => {
        expect.assertions(2);

        const element = document.createElement("div");

        expect(
            getUpdateMapThemeRuntime({
                getHTMLElement: () => HTMLElement,
            }).isHTMLElement(element)
        ).toBe(true);
        expect(getUpdateMapThemeRuntime({}).isHTMLElement(element)).toBe(false);
    });

    it("ignores legacy direct runtime primitive properties", () => {
        expect.assertions(8);

        let controllerCount = 0;
        class TestAbortController extends AbortController {
            public constructor() {
                super();
                controllerCount += 1;
            }
        }
        const map = document.createElement("div");
        map.id = "leaflet-map";
        const documentLike = {
            addEventListener: vi.fn<Document["addEventListener"]>(),
            querySelector: vi.fn<Document["querySelector"]>(() => map),
        } as unknown as Document;
        const beforeUnloadTarget = {
            addEventListener: vi.fn<EventTarget["addEventListener"]>(),
        };
        const runtime = getUpdateMapThemeRuntime({
            AbortController: TestAbortController,
            beforeUnloadTarget,
            document: documentLike,
            HTMLElement,
        } as unknown as Parameters<typeof getUpdateMapThemeRuntime>[0]);

        runtime.addDocumentListener("themechange", vi.fn(), {});
        runtime.addWindowBeforeUnloadListener(vi.fn(), {});

        expect(() => runtime.createAbortController()).toThrow(
            "updateMapTheme requires an AbortController runtime"
        );
        expect(runtime.queryLeafletMap()).toBeNull();
        expect(runtime.isHTMLElement(map)).toBe(false);
        expect(documentLike.addEventListener).not.toHaveBeenCalled();
        expect(documentLike.querySelector).not.toHaveBeenCalled();
        expect(beforeUnloadTarget.addEventListener).not.toHaveBeenCalled();
        expect(controllerCount).toBe(0);
        expect(getUpdateMapThemeRuntime({}).queryLeafletMap()).toBeNull();
    });
});
