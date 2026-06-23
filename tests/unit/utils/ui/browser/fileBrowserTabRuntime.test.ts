// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";

import { getFileBrowserTabRuntime } from "../../../../../electron-app/utils/ui/browser/fileBrowserTabRuntime.js";

describe("getFileBrowserTabRuntime", () => {
    it("creates abort controllers through the injected runtime", () => {
        expect.assertions(2);

        const controller = new AbortController();
        const AbortControllerConstructor = vi.fn(
            function FakeAbortController() {
                return controller;
            }
        );
        const runtime = getFileBrowserTabRuntime({
            getAbortController: () =>
                AbortControllerConstructor as unknown as typeof AbortController,
        });

        expect(runtime.createAbortController()).toBe(controller);
        expect(AbortControllerConstructor).toHaveBeenCalledOnce();
    });

    it("routes DOM helpers through the injected document", () => {
        expect.assertions(7);

        const documentRef = document.implementation.createHTMLDocument();
        const runtime = getFileBrowserTabRuntime({
            getDocument: () => documentRef,
            getHTMLElement: () => HTMLElement,
        });
        const container = runtime.createElement("div");
        container.id = "content_browser";
        const status = runtime.createElement("div");
        status.id = "fit-browser-status";
        container.append(status);
        documentRef.body.append(container);

        expect(container.ownerDocument).toBe(documentRef);
        expect(status.ownerDocument).toBe(documentRef);
        expect(runtime.getElementById("content_browser")).toBe(container);
        expect(runtime.getElement("#fit-browser-status")).toBe(status);
        expect(runtime.isHTMLElement(status)).toBe(true);
        expect(runtime.getElement("#missing")).toBeNull();
        expect(document.getElementById("content_browser")).toBeNull();
    });

    it("fails clearly when explicit runtime dependencies are unavailable", () => {
        expect.assertions(4);

        const runtime = getFileBrowserTabRuntime({});

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.getElement("#content_browser")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLElement runtime"
        );
    });

    it("ignores legacy direct runtime properties", () => {
        expect.assertions(5);

        const AbortControllerConstructor = vi.fn();
        const runtime = getFileBrowserTabRuntime({
            AbortController:
                AbortControllerConstructor as unknown as typeof AbortController,
            document,
            HTMLElement,
        } as unknown as Parameters<typeof getFileBrowserTabRuntime>[0]);

        expect(() => runtime.createAbortController()).toThrow(
            "fileBrowserTab requires an AbortController runtime"
        );
        expect(() => runtime.createElement("div")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.getElementById("content_browser")).toThrow(
            "fileBrowserTab requires a document runtime"
        );
        expect(() => runtime.isHTMLElement(document.body)).toThrow(
            "fileBrowserTab requires an HTMLElement runtime"
        );
        expect(AbortControllerConstructor).not.toHaveBeenCalled();
    });
});
