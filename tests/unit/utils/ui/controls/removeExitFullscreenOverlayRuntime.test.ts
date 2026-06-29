import { afterEach, describe, expect, it, vi } from "vitest";

import { getRemoveExitFullscreenOverlayRuntime } from "../../../../../electron-app/utils/ui/controls/removeExitFullscreenOverlayRuntime.js";

describe("getRemoveExitFullscreenOverlayRuntime", () => {
    const unavailableRemoveExitFullscreenOverlayRuntimeScope = {
        getDocument: () => undefined,
        getHTMLElement: () => undefined,
    } satisfies Parameters<typeof getRemoveExitFullscreenOverlayRuntime>[0];

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("identifies elements through the injected document", () => {
        expect.assertions(2);

        const runtime = getRemoveExitFullscreenOverlayRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });

    it("does not borrow document-window element constructors for explicit documents", () => {
        expect.assertions(1);

        const scopedDocument = {
            defaultView: {
                HTMLElement,
            },
        } as Document;
        const runtime = getRemoveExitFullscreenOverlayRuntime({
            getDocument: () => scopedDocument,
            getHTMLElement: () => undefined,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(
            false
        );
    });

    it("resolves default browser primitives when runtime operations run", () => {
        expect.assertions(2);

        const utils = getRemoveExitFullscreenOverlayRuntime();

        vi.stubGlobal("document", document);

        expect(utils.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(utils.isHTMLElement({})).toBe(false);
    });

    it("fails clearly when the document runtime is unavailable", () => {
        expect.assertions(1);

        const runtime = getRemoveExitFullscreenOverlayRuntime(
            unavailableRemoveExitFullscreenOverlayRuntimeScope
        );

        expect(() => runtime.isHTMLElement({})).toThrow(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    });

    it("fails clearly when required providers are omitted", () => {
        expect.assertions(2);

        const runtime = getRemoveExitFullscreenOverlayRuntime(
            {} as unknown as Parameters<
                typeof getRemoveExitFullscreenOverlayRuntime
            >[0]
        );

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("removeExitFullscreenOverlay requires a document provider");
        expect(() => runtime.isHTMLElement({})).toThrow(
            "removeExitFullscreenOverlay requires a document provider"
        );
    });

    it("fails clearly when the HTMLElement provider is omitted", () => {
        expect.assertions(1);

        const runtime = getRemoveExitFullscreenOverlayRuntime({
            getDocument: () => document,
        } as unknown as Parameters<
            typeof getRemoveExitFullscreenOverlayRuntime
        >[0]);

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow(
            "removeExitFullscreenOverlay requires an HTMLElement provider"
        );
    });

    it("fails clearly when individual provider slots are omitted", () => {
        expect.assertions(2);

        expect(() =>
            getRemoveExitFullscreenOverlayRuntime({
                ...unavailableRemoveExitFullscreenOverlayRuntimeScope,
                getDocument: undefined,
            }).isHTMLElement(document.createElement("div"))
        ).toThrow("removeExitFullscreenOverlay requires a document provider");
        expect(() =>
            getRemoveExitFullscreenOverlayRuntime({
                ...unavailableRemoveExitFullscreenOverlayRuntimeScope,
                getDocument: () => document,
                getHTMLElement: undefined,
            }).isHTMLElement(document.createElement("div"))
        ).toThrow(
            "removeExitFullscreenOverlay requires an HTMLElement provider"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(2);

        const runtime = getRemoveExitFullscreenOverlayRuntime({
            ...unavailableRemoveExitFullscreenOverlayRuntimeScope,
            document,
            HTMLElement,
        } as unknown as Parameters<
            typeof getRemoveExitFullscreenOverlayRuntime
        >[0]);

        expect(() =>
            runtime.isHTMLElement(document.createElement("div"))
        ).toThrow("removeExitFullscreenOverlay requires a document runtime");
        expect(() => runtime.isHTMLElement({})).toThrow(
            "removeExitFullscreenOverlay requires a document runtime"
        );
    });

    it("uses the explicit element constructor provider for scoped element checks", () => {
        expect.assertions(2);

        const runtime = getRemoveExitFullscreenOverlayRuntime({
            getDocument: () => document,
            getHTMLElement: () => HTMLElement,
        });

        expect(runtime.isHTMLElement(document.createElement("div"))).toBe(true);
        expect(runtime.isHTMLElement({})).toBe(false);
    });
});
