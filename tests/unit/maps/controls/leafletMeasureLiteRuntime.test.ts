import { describe, expect, it, vi } from "vitest";

import { getLeafletMeasureLiteRuntime } from "../../../../electron-app/renderer/leafletMeasureLiteRuntime.js";

describe("leafletMeasureLiteRuntime", () => {
    it("routes keydown listeners through the injected document provider", () => {
        expect.assertions(3);

        const unusedDocumentTarget = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        const documentEventTarget = new EventTarget();
        const runtime = getLeafletMeasureLiteRuntime({
            documentEventTarget: unusedDocumentTarget,
            getDocumentEventTarget: () => documentEventTarget,
        });
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };

        runtime.addDocumentKeydownListener(listener);
        documentEventTarget.dispatchEvent(new Event("keydown"));
        runtime.removeDocumentKeydownListener(listener);
        documentEventTarget.dispatchEvent(new Event("keydown"));

        expect(handledEventTypes).toStrictEqual(["keydown"]);
        expect(unusedDocumentTarget.addEventListener).not.toHaveBeenCalled();
        expect(unusedDocumentTarget.removeEventListener).not.toHaveBeenCalled();
    });

    it("fails clearly when the document provider is unavailable", () => {
        expect.assertions(2);

        const runtime = getLeafletMeasureLiteRuntime({});
        const listener = vi.fn();

        expect(() => runtime.addDocumentKeydownListener(listener)).toThrow(
            "leafletMeasureLite requires a document event-target runtime"
        );
        expect(() => runtime.removeDocumentKeydownListener(listener)).toThrow(
            "leafletMeasureLite requires a document event-target runtime"
        );
    });
});
