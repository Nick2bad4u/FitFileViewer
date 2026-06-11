import { describe, expect, it, vi } from "vitest";

import { getUpdateMapThemeRuntime } from "../../../../electron-app/utils/theming/specific/updateMapThemeRuntime.js";

describe("getUpdateMapThemeRuntime", () => {
    it("queries the Leaflet map through the injected document", () => {
        expect.assertions(1);

        try {
            const map = document.createElement("div");
            map.id = "leaflet-map";
            document.body.append(map);

            expect(
                getUpdateMapThemeRuntime({ document }).queryLeafletMap()
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
        const runtime = getUpdateMapThemeRuntime({ document: documentLike });

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
            window: {
                addEventListener:
                    eventTarget.addEventListener.bind(eventTarget),
            },
        });

        runtime.addWindowBeforeUnloadListener(listener, {
            passive: true,
        });
        eventTarget.dispatchEvent(new Event("beforeunload"));

        expect(eventCount).toBe(1);
    });

    it("checks HTMLElement instances through the injected constructor", () => {
        expect.assertions(2);

        const element = document.createElement("div");

        expect(
            getUpdateMapThemeRuntime({ HTMLElement }).isHTMLElement(element)
        ).toBe(true);
        expect(getUpdateMapThemeRuntime({}).isHTMLElement(element)).toBe(false);
    });
});
