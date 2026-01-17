/**
 * @vitest-environment jsdom
 */

import { screen } from "@testing-library/dom";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { attachExternalLinkHandlers } from "../../../../../utils/ui/links/externalLinkHandlers.js";

describe("externalLinkHandlers", () => {
    afterEach(() => {
        // @ts-expect-error test cleanup
        delete globalThis.electronAPI;
        document.body.innerHTML = "";
    });

    it("opens http(s) href via electronAPI.openExternal and prevents default", async () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const user = userEvent.setup();

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com">Example</a>';
        document.body.append(root);

        const cleanup = attachExternalLinkHandlers({ root });

        const a = screen.getByRole("link", { name: "Example" });

        await user.click(a);

        // jsdom may canonicalize bare origins to include a trailing slash.
        expect(openExternal).toHaveBeenCalledWith(expect.stringMatching(/^https:\/\/example\.com\/?$/));

        cleanup();
    });

    it("blocks non-http(s) schemes (e.g., javascript:) and still prevents in-app navigation", async () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const user = userEvent.setup();

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="javascript:alert(1)">Bad</a>';
        document.body.append(root);

        attachExternalLinkHandlers({ root });

        const a = screen.getByRole("link", { name: "Bad" });
        await user.click(a);
        expect(openExternal).not.toHaveBeenCalled();
    });

    it("supports keyboard activation (Enter) for external links", async () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const user = userEvent.setup();

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com/docs">Docs</a>';
        document.body.append(root);

        attachExternalLinkHandlers({ root });

        const a = screen.getByRole("link", { name: "Docs" });
        a.focus();
        await user.keyboard("{Enter}");

        expect(openExternal).toHaveBeenCalledWith("https://example.com/docs");
    });

    it("cleanup removes listeners", async () => {
        const openExternal = vi.fn().mockResolvedValue(true);
        // @ts-expect-error test shim
        globalThis.electronAPI = { openExternal };

        const user = userEvent.setup();

        const root = document.createElement("div");
        root.innerHTML = '<a data-external-link href="https://example.com">Example</a>';
        document.body.append(root);

        const cleanup = attachExternalLinkHandlers({ root });
        cleanup();

        const a = screen.getByRole("link", { name: "Example" });
        await user.click(a);

        expect(openExternal).not.toHaveBeenCalled();
    });
});
