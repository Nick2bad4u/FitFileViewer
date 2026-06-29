import { afterEach, describe, expect, it, vi } from "vitest";

import { getExternalLinkHandlersRuntime } from "../../../../../electron-app/utils/ui/links/externalLinkHandlersRuntime.js";

type ExternalLinkHandlersRuntimeScope = NonNullable<
    Parameters<typeof getExternalLinkHandlersRuntime>[0]
>;

function createRuntimeScope(
    overrides: Partial<ExternalLinkHandlersRuntimeScope> = {}
): ExternalLinkHandlersRuntimeScope {
    return {
        getElement: () => undefined,
        getHTMLAnchorElement: () => undefined,
        getKeyboardEvent: () => undefined,
        getOpen: () => undefined,
        ...overrides,
    };
}

describe("getExternalLinkHandlersRuntime", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("opens browser windows through the injected opener", () => {
        expect.assertions(4);

        let openedUrl = "";
        let openedTarget = "";
        let openedFeatures = "";
        const openedWindow = {} as WindowProxy;
        const runtime = getExternalLinkHandlersRuntime(
            createRuntimeScope({
                getOpen: () =>
                    function open(url, target, features): WindowProxy {
                        openedUrl = String(url);
                        openedTarget = target ?? "";
                        openedFeatures = features ?? "";
                        return openedWindow;
                    },
            })
        );

        const result = runtime.openBrowserWindow(
            "https://example.com",
            "_blank",
            "noopener,noreferrer"
        );

        expect(result).toBe(openedWindow);
        expect(openedUrl).toBe("https://example.com");
        expect(openedTarget).toBe("_blank");
        expect(openedFeatures).toBe("noopener,noreferrer");
    });

    it("resolves delegated anchors and keyboard events through injected constructors", () => {
        expect.assertions(6);

        const documentRef =
            document.implementation.createHTMLDocument("external links");
        const anchor = documentRef.createElement("a");
        const child = documentRef.createElement("span");
        const plainLink = documentRef.createElement("a");
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Enter" });
        const runtime = getExternalLinkHandlersRuntime(
            createRuntimeScope({
                getElement: () => Element,
                getHTMLAnchorElement: () => HTMLAnchorElement,
                getKeyboardEvent: () => KeyboardEvent,
            })
        );

        anchor.dataset.externalLink = "";
        anchor.append(child);

        expect(runtime.resolveExternalLinkAnchor(child)).toBe(anchor);
        expect(runtime.resolveExternalLinkAnchor(plainLink)).toBeNull();
        expect(runtime.resolveExternalLinkAnchor(null)).toBeNull();
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(runtime.isKeyboardEvent({ key: "Enter" })).toBe(false);
    });

    it("ignores legacy direct opener properties", () => {
        expect.assertions(8);

        const open = vi.fn(() => ({}) as WindowProxy);
        const runtime = getExternalLinkHandlersRuntime({
            Element,
            HTMLAnchorElement,
            KeyboardEvent,
            open,
        } as unknown as Parameters<typeof getExternalLinkHandlersRuntime>[0]);
        const target = document.createElement("span");

        expect(() =>
            runtime.openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toThrow("externalLinkHandlers requires an open provider");
        expect(open).not.toHaveBeenCalled();
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "externalLinkHandlers requires a KeyboardEvent provider"
        );
        expect(() => runtime.resolveExternalLinkAnchor(target)).toThrow(
            "externalLinkHandlers requires an Element provider"
        );
        expect(
            (runtime as unknown as { Element?: unknown }).Element
        ).toBeUndefined();
        expect(
            (runtime as unknown as { HTMLAnchorElement?: unknown })
                .HTMLAnchorElement
        ).toBeUndefined();
        expect(
            (runtime as unknown as { KeyboardEvent?: unknown }).KeyboardEvent
        ).toBeUndefined();
        expect(open).not.toHaveBeenCalled();
    });

    it("fails clearly when providers are omitted", () => {
        expect.assertions(4);
        const runtime = getExternalLinkHandlersRuntime(
            {} as ExternalLinkHandlersRuntimeScope
        );

        expect(() =>
            runtime.openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toThrow("externalLinkHandlers requires an open provider");
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "externalLinkHandlers requires a KeyboardEvent provider"
        );
        expect(() =>
            runtime.resolveExternalLinkAnchor(document.createElement("span"))
        ).toThrow("externalLinkHandlers requires an Element provider");
        expect(runtime.resolveExternalLinkAnchor(null)).toBeNull();
    });

    it("returns null when a browser opener is unavailable", () => {
        expect.assertions(4);
        const runtime = getExternalLinkHandlersRuntime(createRuntimeScope());

        expect(
            runtime.openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toBeNull();
        expect(() => runtime.isKeyboardEvent(new Event("keydown"))).toThrow(
            "externalLinkHandlers requires a KeyboardEvent runtime"
        );
        expect(() =>
            runtime.resolveExternalLinkAnchor(document.createElement("span"))
        ).toThrow("externalLinkHandlers requires an Element runtime");
        expect(runtime.resolveExternalLinkAnchor(null)).toBeNull();
    });

    it("resolves the default browser opener when links are opened", () => {
        expect.assertions(2);

        const openedWindow = {} as WindowProxy;
        const open = vi.fn(() => openedWindow);
        const runtime = getExternalLinkHandlersRuntime();

        vi.stubGlobal("open", open);

        expect(
            runtime.openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toBe(openedWindow);
        expect(open).toHaveBeenCalledWith(
            "https://example.com",
            "_blank",
            "noopener,noreferrer"
        );
    });

    it("uses shared browser providers for production defaults", () => {
        expect.assertions(5);

        const openedWindow = {} as WindowProxy;
        const open = vi.fn(() => openedWindow);
        vi.stubGlobal("open", open);

        const anchor = document.createElement("a");
        const child = document.createElement("span");
        const keyboardEvent = new KeyboardEvent("keydown", { key: "Enter" });
        const runtime = getExternalLinkHandlersRuntime();
        anchor.dataset.externalLink = "";
        anchor.append(child);

        expect(runtime.resolveExternalLinkAnchor(child)).toBe(anchor);
        expect(runtime.isKeyboardEvent(keyboardEvent)).toBe(true);
        expect(runtime.isKeyboardEvent(new Event("keydown"))).toBe(false);
        expect(
            runtime.openBrowserWindow(
                "https://example.com",
                "_blank",
                "noopener,noreferrer"
            )
        ).toBe(openedWindow);
        expect(open).toHaveBeenCalledWith(
            "https://example.com",
            "_blank",
            "noopener,noreferrer"
        );
    });
});
