/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it, vi } from "vitest";

import { attachExternalLinkHandlers } from "../../../../../utils/ui/links/externalLinkHandlers.js";

describe("externalLinkHandlers", () => {
    afterEach(() => {
        // @ts-expect-error test cleanup
        delete globalThis.electronAPI;
        document.body.innerHTML = "";
    });

    it("opens http(s) href via electronAPI.openExternal and prevents default", () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com">Example</a>';
        document.body.append(root);

        const cleanup = attachExternalLinkHandlers({ root });

        const a = root.querySelector("a") as HTMLAnchorElement;
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        a.dispatchEvent(ev);

        expect(ev.defaultPrevented).toBe(true);
        expect(openExternal).toHaveBeenCalledWith("https://example.com");

        cleanup();
    });

    it("blocks non-http(s) schemes (e.g., javascript:) and still prevents in-app navigation", () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="javascript:alert(1)">Bad</a>';
        document.body.append(root);

        attachExternalLinkHandlers({ root });

        const a = root.querySelector("a") as HTMLAnchorElement;
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        a.dispatchEvent(ev);

        expect(ev.defaultPrevented).toBe(true);
        expect(openExternal).not.toHaveBeenCalled();
    });

    it("supports keyboard activation (Enter) for external links", () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com/docs">Docs</a>';
        document.body.append(root);

        attachExternalLinkHandlers({ root });

        const a = root.querySelector("a") as HTMLAnchorElement;
        const ev = new KeyboardEvent("keydown", { bubbles: true, cancelable: true, key: "Enter" });
        a.dispatchEvent(ev);

        expect(ev.defaultPrevented).toBe(true);
        expect(openExternal).toHaveBeenCalledWith("https://example.com/docs");
    });

    it("cleanup removes listeners", () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com">Example</a>';
        document.body.append(root);

        const cleanup = attachExternalLinkHandlers({ root });
        cleanup();

        const a = root.querySelector("a") as HTMLAnchorElement;
        const ev = new MouseEvent("click", { bubbles: true, cancelable: true });
        a.dispatchEvent(ev);

        expect(openExternal).not.toHaveBeenCalled();
    });
});
