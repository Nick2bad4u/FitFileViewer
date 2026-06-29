import { describe, expect, it, vi } from "vitest";

import { getLeafletMeasureLiteRuntime } from "../../../../electron-app/renderer/leafletMeasureLiteRuntime.js";

function createLeafletMeasureLiteRuntimeScope(overrides = {}) {
    return {
        getDocument: () => undefined,
        getDocumentEventTarget: () => undefined,
        ...overrides,
    };
}

describe("leafletMeasureLiteRuntime", () => {
    it("routes keydown listeners through the injected document provider", () => {
        expect.assertions(1);

        const documentEventTarget = new EventTarget();
        const runtime = getLeafletMeasureLiteRuntime(
            createLeafletMeasureLiteRuntimeScope({
                getDocumentEventTarget: () => documentEventTarget,
            })
        );
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };

        runtime.addDocumentKeydownListener(listener);
        documentEventTarget.dispatchEvent(new Event("keydown"));
        runtime.removeDocumentKeydownListener(listener);
        documentEventTarget.dispatchEvent(new Event("keydown"));

        expect(handledEventTypes).toStrictEqual(["keydown"]);
    });

    it("derives keydown listeners from the scoped document provider", () => {
        expect.assertions(3);

        const documentRef = document.implementation.createHTMLDocument();
        const addEventListener = vi.spyOn(documentRef, "addEventListener");
        const handledEventTypes: string[] = [];
        const listener = (event: Event): void => {
            handledEventTypes.push(event.type);
        };
        const runtime = getLeafletMeasureLiteRuntime(
            createLeafletMeasureLiteRuntimeScope({
                getDocument: () => documentRef,
            })
        );

        runtime.addDocumentKeydownListener(listener);
        documentRef.dispatchEvent(new Event("keydown"));
        runtime.removeDocumentKeydownListener(listener);
        documentRef.dispatchEvent(new Event("keydown"));

        expect(addEventListener).toHaveBeenCalledWith("keydown", listener);
        expect(handledEventTypes).toStrictEqual(["keydown"]);
        expect(document.body).not.toBe(documentRef.body);
    });

    it("ignores legacy direct document event-target runtime properties", () => {
        expect.assertions(3);

        const documentEventTarget = {
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
        };
        const legacyScope = {
            documentEventTarget,
        };

        expect(() => getLeafletMeasureLiteRuntime(legacyScope)).toThrow(
            "leafletMeasureLite requires document provider"
        );
        expect(documentEventTarget.addEventListener).not.toHaveBeenCalled();
        expect(documentEventTarget.removeEventListener).not.toHaveBeenCalled();
    });

    it("fails clearly when the document provider is unavailable", () => {
        expect.assertions(2);

        const runtime = getLeafletMeasureLiteRuntime(
            createLeafletMeasureLiteRuntimeScope()
        );
        const listener = vi.fn();

        expect(() => runtime.addDocumentKeydownListener(listener)).toThrow(
            "leafletMeasureLite requires a document event-target runtime"
        );
        expect(() => runtime.removeDocumentKeydownListener(listener)).toThrow(
            "leafletMeasureLite requires a document event-target runtime"
        );
    });

    it("fails clearly when runtime provider slots are omitted", () => {
        expect.assertions(1);

        expect(() => getLeafletMeasureLiteRuntime({})).toThrow(
            "leafletMeasureLite requires document provider"
        );
    });

    it("fails clearly when runtime provider slots are undefined", () => {
        expect.assertions(2);

        expect(() =>
            getLeafletMeasureLiteRuntime(
                createLeafletMeasureLiteRuntimeScope({
                    getDocument: undefined,
                })
            )
        ).toThrow("leafletMeasureLite requires document provider");
        expect(() =>
            getLeafletMeasureLiteRuntime(
                createLeafletMeasureLiteRuntimeScope({
                    getDocumentEventTarget: undefined,
                })
            )
        ).toThrow("leafletMeasureLite requires document event-target provider");
    });
});
