// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest";

import { attachExternalLinkHandlers } from "../../../../../electron-app/utils/ui/links/externalLinkHandlers.js";
import type { RendererElectronApiScope } from "../../../../../electron-app/utils/runtime/electronApiRuntime.js";

type OpenExternal = (url: string) => Promise<boolean>;

type ExternalLinkTestDom = {
    readonly anchor: HTMLAnchorElement;
    readonly parent: HTMLDivElement;
    readonly root: HTMLDivElement;
};

type EventCounter = {
    readonly abort: () => void;
    readonly count: () => number;
};

function createExternalLinkDom(
    href: string,
    label: string
): ExternalLinkTestDom {
    document.body.replaceChildren();

    const parent = document.createElement("div");
    const root = document.createElement("div");
    const anchor = document.createElement("a");

    anchor.dataset.externalLink = "";
    anchor.href = href;
    anchor.textContent = label;

    root.append(anchor);
    parent.append(root);
    document.body.append(parent);

    return { anchor, parent, root };
}

function dispatchClick(anchor: HTMLAnchorElement): MouseEvent {
    const event = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
    });

    anchor.dispatchEvent(event);

    return event;
}

function dispatchEnter(anchor: HTMLAnchorElement): KeyboardEvent {
    const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: "Enter",
    });

    anchor.dispatchEvent(event);

    return event;
}

function dispatchSpace(anchor: HTMLAnchorElement): KeyboardEvent {
    const event = new KeyboardEvent("keydown", {
        bubbles: true,
        cancelable: true,
        key: " ",
    });

    anchor.dispatchEvent(event);

    return event;
}

function createElectronApiScope(
    openExternal: OpenExternal
): RendererElectronApiScope {
    return {
        getElectronAPI: () => ({ openExternal }),
    };
}

function countParentEvents(
    parent: HTMLElement,
    eventName: "click" | "keydown"
): EventCounter {
    const controller = new AbortController();
    let eventCount = 0;

    parent.addEventListener(
        eventName,
        () => {
            eventCount += 1;
        },
        { signal: controller.signal }
    );

    return {
        abort: () => {
            controller.abort();
        },
        count: () => eventCount,
    };
}

describe("externalLinkHandlers", () => {
    it("opens http(s) href via electronAPI.openExternal and prevents default", () => {
        expect.assertions(4);

        const openExternal = vi.fn<OpenExternal>().mockResolvedValue(true);
        const electronApiScope = createElectronApiScope(openExternal);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com",
            "Example"
        );
        const parentClicks = countParentEvents(parent, "click");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            root,
        });
        const event = dispatchClick(anchor);

        // jsdom may canonicalize bare origins to include a trailing slash.
        expect(openExternal).toHaveBeenCalledWith(
            expect.stringMatching(/^https:\/\/example\.com\/?$/)
        );
        expect(Number(event.defaultPrevented)).toBe(1);
        expect(parentClicks.count()).toBe(0);
        expect(anchor.parentElement).toBe(root);

        cleanup();
        parentClicks.abort();
    });

    it("blocks non-http(s) schemes and still prevents in-app navigation", () => {
        expect.assertions(4);

        const openExternal = vi.fn<OpenExternal>().mockResolvedValue(true);
        const electronApiScope = createElectronApiScope(openExternal);

        const { anchor, parent, root } = createExternalLinkDom(
            "javascript:alert(1)",
            "Bad"
        );
        const parentClicks = countParentEvents(parent, "click");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            root,
        });
        const event = dispatchClick(anchor);

        expect(openExternal).not.toHaveBeenCalled();
        expect(Number(event.defaultPrevented)).toBe(1);
        expect(parentClicks.count()).toBe(0);
        expect(anchor.protocol).toBe("javascript:");

        cleanup();
        parentClicks.abort();
    });

    it("supports keyboard activation with Enter for external links", () => {
        expect.assertions(4);

        const openExternal = vi.fn<OpenExternal>().mockResolvedValue(true);
        const electronApiScope = createElectronApiScope(openExternal);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com/docs",
            "Docs"
        );
        const parentKeydowns = countParentEvents(parent, "keydown");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            root,
        });
        const event = dispatchEnter(anchor);

        expect(openExternal).toHaveBeenCalledWith("https://example.com/docs");
        expect(Number(event.defaultPrevented)).toBe(1);
        expect(parentKeydowns.count()).toBe(0);
        expect(document.activeElement).not.toBe(anchor);

        cleanup();
        parentKeydowns.abort();
    });

    it("does not hijack Space key behavior for native anchors", () => {
        expect.assertions(3);

        const openExternal = vi.fn<OpenExternal>().mockResolvedValue(true);
        const electronApiScope = createElectronApiScope(openExternal);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com/docs",
            "Docs"
        );
        const parentKeydowns = countParentEvents(parent, "keydown");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            root,
        });
        const event = dispatchSpace(anchor);

        expect(openExternal).not.toHaveBeenCalled();
        expect(Number(event.defaultPrevented)).toBe(0);
        expect(parentKeydowns.count()).toBe(1);

        cleanup();
        parentKeydowns.abort();
    });

    it("cleanup removes listeners", () => {
        expect.assertions(4);

        const openExternal = vi.fn<OpenExternal>().mockResolvedValue(true);
        const electronApiScope = createElectronApiScope(openExternal);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com",
            "Example"
        );
        const parentClicks = countParentEvents(parent, "click");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            root,
        });
        cleanup();

        const event = dispatchClick(anchor);

        expect(openExternal).not.toHaveBeenCalled();
        expect(Number(event.defaultPrevented)).toBe(0);
        expect(parentClicks.count()).toBe(1);
        expect(anchor.parentElement).toBe(root);

        parentClicks.abort();
    });

    it("falls back to browser window opening when electronAPI is unavailable", () => {
        expect.assertions(4);

        const openSpy = vi
            .spyOn(window, "open")
            .mockReturnValue(null as Window | null);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com/fallback",
            "Fallback"
        );
        const parentClicks = countParentEvents(parent, "click");

        const cleanup = attachExternalLinkHandlers({ root });
        const event = dispatchClick(anchor);

        expect(openSpy).toHaveBeenCalledWith(
            "https://example.com/fallback",
            "_blank",
            "noopener,noreferrer"
        );
        expect(Number(event.defaultPrevented)).toBe(1);
        expect(parentClicks.count()).toBe(0);
        expect(anchor.parentElement).toBe(root);

        cleanup();
        parentClicks.abort();
        openSpy.mockRestore();
    });

    it("invokes onOpenExternalError when electronAPI.openExternal rejects", async () => {
        expect.assertions(5);

        const openExternal = vi
            .fn<OpenExternal>()
            .mockRejectedValueOnce(new Error("blocked"));
        const onOpenExternalError =
            vi.fn<(url: string, error: Error) => void>();
        const electronApiScope = createElectronApiScope(openExternal);
        const openSpy = vi
            .spyOn(window, "open")
            .mockReturnValue(null as Window | null);

        const { anchor, parent, root } = createExternalLinkDom(
            "https://example.com",
            "Example"
        );
        const parentClicks = countParentEvents(parent, "click");

        const cleanup = attachExternalLinkHandlers({
            electronApiScope,
            onOpenExternalError,
            root,
        });
        const event = dispatchClick(anchor);

        await Promise.resolve();

        expect(openExternal).toHaveBeenCalledWith(
            expect.stringMatching(/^https:\/\/example\.com\/?$/)
        );
        expect(openSpy).not.toHaveBeenCalled();
        expect(onOpenExternalError).toHaveBeenCalledExactlyOnceWith(
            expect.stringMatching(/^https:\/\/example\.com\/?$/),
            expect.any(Error)
        );
        expect(Number(event.defaultPrevented)).toBe(1);
        expect(parentClicks.count()).toBe(0);

        cleanup();
        parentClicks.abort();
        openSpy.mockRestore();
    });
});
